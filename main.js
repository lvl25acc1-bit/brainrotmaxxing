const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

process.on('uncaughtException', err => {
  const message = err && err.message ? err.message : '';
  if (message.includes('Render frame was disposed before WebFrameMain could be accessed')) {
    console.warn('[brainrot] ignored stale webview frame event');
    return;
  }
  console.error('[brainrot] uncaught exception:', err);
  setTimeout(() => process.exit(1), 0);
});

let pty;
try {
  pty = require('node-pty');
} catch (e) {
  console.error('[brainrot] node-pty failed to load:', e.message);
  pty = null;
}

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
const BUNDLED_MODULES_DIR = path.join(__dirname, 'modules');
const MODULE_TYPES = new Set(['webview', 'webview-tabs', 'terminal']);
const MODULE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/;
const DEFAULT_COOKIE_DOMAINS = [
  'google.com',
  'youtube.com',
  'googleusercontent.com',
  'googleapis.com',
  'gstatic.com',
  'ytimg.com',
];
const terms = new Map();
const configuredWebContents = new WeakSet();
let terminalEnvCache = null;

function normalizeHttpUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || '').trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function openExternalUrl(rawUrl) {
  const target = normalizeHttpUrl(rawUrl);
  if (!target) return { ok: false, error: 'invalid url' };
  try {
    await shell.openExternal(target);
    return { ok: true };
  } catch (err) {
    console.error('[brainrot] failed to open external URL:', err.message);
    return { ok: false, error: err.message };
  }
}

function normalizeDomains(domains, fallback = DEFAULT_COOKIE_DOMAINS) {
  const source = Array.isArray(domains) ? domains : fallback;
  return uniq(source
    .map(domain => String(domain || '').trim().toLowerCase().replace(/^\.+/, ''))
    .filter(domain => /^[a-z0-9.-]+$/.test(domain) && domain.includes('.') && !domain.endsWith('.')));
}

function cookieWhereForDomains(domains) {
  return domains.map(domain => {
    const escaped = domain.replace(/'/g, "''");
    return `(host_key = '${escaped}' OR host_key = '.${escaped}' OR host_key LIKE '%.${escaped}')`;
  }).join(' OR ');
}

function hostMatchesDomain(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function normalizeTermId(value) {
  const id = String(value || '').trim();
  return /^[a-zA-Z0-9_.:-]{1,96}$/.test(id) ? id : null;
}

function wirePopupWindows(wc) {
  if (!wc || configuredWebContents.has(wc)) return;
  configuredWebContents.add(wc);
  wc.setUserAgent(DESKTOP_UA);
  if (typeof wc.setBackgroundThrottling === 'function') {
    wc.setBackgroundThrottling(false);
  }

  wc.setWindowOpenHandler(() => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        backgroundColor: '#000',
        webPreferences: {
          partition: 'persist:main',
          contextIsolation: true,
          nodeIntegration: false,
          backgroundThrottling: false,
          sandbox: true,
        },
      },
    };
  });
}

function userModulesDir() {
  return path.join(app.getPath('userData'), 'modules');
}

function safeModuleId(value) {
  const id = String(value || '').trim();
  return MODULE_ID_RE.test(id) ? id : null;
}

function slugifyModuleId(value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return safeModuleId(slug) || null;
}

function userModulePath(id) {
  const safeId = safeModuleId(id);
  if (!safeId) return null;
  return path.join(userModulesDir(), `${safeId}.json`);
}

function cleanText(value, fallback = '', max = 240) {
  const text = String(value == null ? fallback : value).trim();
  return text.slice(0, max);
}

function cleanOptionalText(value, max = 240) {
  const text = cleanText(value, '', max);
  return text || undefined;
}

function normalizeModuleUrl(rawUrl, fieldName) {
  const url = normalizeHttpUrl(rawUrl);
  if (!url) throw new Error(`${fieldName} must be a valid http or https URL`);
  return url;
}

function normalizeModuleSpan(value) {
  if (!value || typeof value !== 'object') return undefined;
  const cols = clampInt(value.cols, 1, 8, 2);
  const rows = clampInt(value.rows, 1, 6, 2);
  return { cols, rows };
}

function normalizeModule(rawModule) {
  const raw = rawModule && typeof rawModule === 'object' ? rawModule : {};
  const id = safeModuleId(raw.id) || slugifyModuleId(raw.name);
  if (!id) throw new Error('Module ID must start with a letter or number and use only letters, numbers, dot, underscore, or dash');

  const name = cleanText(raw.name, '', 80);
  if (!name) throw new Error('Name is required');

  const type = cleanText(raw.type, '', 40);
  if (!MODULE_TYPES.has(type)) throw new Error('Type must be webview, webview-tabs, or terminal');

  const module = { id, name, type };
  const category = cleanOptionalText(raw.category, 40);
  const icon = cleanOptionalText(raw.icon, 12);
  const defaultSpan = normalizeModuleSpan(raw.defaultSpan);
  const order = Number(raw.order);
  if (category) module.category = category;
  if (icon) module.icon = icon;
  if (defaultSpan) module.defaultSpan = defaultSpan;
  if (Number.isFinite(order)) module.order = Math.max(0, Math.min(999, Math.round(order)));

  if (type === 'webview') {
    module.url = normalizeModuleUrl(raw.url, 'URL');
  }

  if (type === 'webview-tabs') {
    if (!Array.isArray(raw.tabs) || raw.tabs.length === 0) {
      throw new Error('Tabbed web modules need at least one tab');
    }
    module.tabs = raw.tabs.slice(0, 12).map((tab, index) => {
      const label = cleanText(tab && tab.label, '', 32);
      if (!label) throw new Error(`Tab ${index + 1} needs a label`);
      return {
        label,
        url: normalizeModuleUrl(tab && tab.url, `Tab ${index + 1} URL`),
        default: index === 0,
      };
    });
  }

  if (type === 'terminal') {
    const command = cleanText(raw.command, '', 300);
    if (!command) throw new Error('Command is required');
    module.command = command;
    if (Array.isArray(raw.args)) {
      module.args = raw.args.map(arg => String(arg)).filter(arg => arg.length > 0).slice(0, 80);
    } else {
      module.args = [];
    }
    const cwd = cleanOptionalText(raw.cwd, 1000);
    if (cwd) module.cwd = cwd;
  }

  return module;
}

function publicModule(module, source, filePath = null) {
  return {
    ...module,
    _source: source,
    _userEditable: source !== 'bundled',
    _fileName: filePath ? path.basename(filePath) : null,
  };
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function getLoginShellPath(shellBin) {
  try {
    return execFileSync(
      shellBin,
      ['-l', '-c', 'printf %s "$PATH"'],
      { env: { ...process.env, HOME: os.homedir() }, timeout: 5000 }
    ).toString();
  } catch {
    return '';
  }
}

function expandHome(filePath) {
  if (!filePath || typeof filePath !== 'string') return '';
  if (filePath === '~') return os.homedir();
  if (filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function isExecutable(filePath) {
  try {
    const resolved = expandHome(filePath);
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return false;
    fs.accessSync(resolved, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function chooseShell() {
  return uniq([process.env.SHELL, '/bin/zsh', '/bin/bash', '/bin/sh']).find(isExecutable) || '/bin/sh';
}

function buildTerminalEnv() {
  if (terminalEnvCache) return terminalEnvCache;

  const shellBin = chooseShell();
  const extraPaths = [
    getLoginShellPath(shellBin),
    process.env.PATH || '',
    path.join(os.homedir(), '.local/bin'),
    path.join(os.homedir(), '.npm-global/bin'),
    path.join(os.homedir(), '.cargo/bin'),
    '/Applications/Codex.app/Contents/Resources',
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ].flatMap(p => p.split(':'));

  terminalEnvCache = {
    ...process.env,
    HOME: os.homedir(),
    SHELL: shellBin,
    TERM: 'xterm-256color',
    PATH: uniq(extraPaths).join(':'),
  };
  return terminalEnvCache;
}

function terminalCommandFallbacks(command) {
  if (command === 'codex') {
    return ['/Applications/Codex.app/Contents/Resources/codex'];
  }
  if (command === 'claude') {
    return [
      path.join(os.homedir(), '.local/bin/claude'),
      '/opt/homebrew/bin/claude',
      '/usr/local/bin/claude',
    ];
  }
  return [];
}

function resolveExecutable(command, env, cwd) {
  const raw = expandHome(String(command || '').trim());
  if (!raw) return null;

  const candidates = [];
  if (raw.includes('/') || raw.startsWith('.')) {
    candidates.push(path.isAbsolute(raw) ? raw : path.resolve(cwd || os.homedir(), raw));
  } else {
    for (const dir of String(env.PATH || '').split(path.delimiter)) {
      if (dir) candidates.push(path.join(dir, raw));
    }
    candidates.push(...terminalCommandFallbacks(raw));
  }

  return candidates.find(isExecutable) || null;
}

function safeWorkingDirectory(cwd) {
  const candidates = [cwd, process.cwd(), os.homedir()]
    .map(candidate => {
      if (!candidate) return candidate;
      const expanded = expandHome(candidate);
      return path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
    });
  for (const candidate of candidates) {
    try {
      if (candidate && fs.statSync(candidate).isDirectory()) return candidate;
    } catch {}
  }
  return os.homedir();
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function emitTermData(id, data) {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send('term:data', id, data);
  }
}

function emitTermExit(id, code) {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send('term:exit', id, code);
  }
  terms.delete(id);
}

function makePtyTerminal(term) {
  return {
    write: data => term.write(data),
    resize: (cols, rows) => term.resize(cols, rows),
    kill: () => term.kill(),
    onData: cb => term.onData(cb),
    onExit: cb => term.onExit(({ exitCode }) => cb(exitCode)),
  };
}

function loadModules() {
  const userDir = userModulesDir();
  try { fs.mkdirSync(userDir, { recursive: true }); } catch {}

  const byId = new Map();
  for (const dir of [BUNDLED_MODULES_DIR, userDir]) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json') && !f.startsWith('_'));
    for (const f of entries) {
      const filePath = path.join(dir, f);
      try {
        const m = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!m.id) m.id = path.basename(f, '.json');
        const source = dir === userDir
          ? (byId.has(m.id) ? 'override' : 'custom')
          : 'bundled';
        byId.set(m.id, publicModule(m, source, filePath));
      } catch (err) {
        console.error(`[brainrot] bad module ${dir}/${f}:`, err.message);
      }
    }
  }
  return [...byId.values()].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

function saveUserModule(rawModule, previousId = null) {
  const module = normalizeModule(rawModule);
  const modulePath = userModulePath(module.id);
  if (!modulePath) throw new Error('Invalid module ID');
  fs.mkdirSync(userModulesDir(), { recursive: true });

  const oldId = safeModuleId(previousId);
  if (oldId && oldId !== module.id) {
    const oldPath = userModulePath(oldId);
    if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  fs.writeFileSync(modulePath, `${JSON.stringify(module, null, 2)}\n`, 'utf8');
  return publicModule(module, fs.existsSync(path.join(BUNDLED_MODULES_DIR, `${module.id}.json`)) ? 'override' : 'custom', modulePath);
}

function deleteUserModule(id) {
  const safeId = safeModuleId(id);
  if (!safeId) throw new Error('Invalid module ID');
  const modulePath = userModulePath(safeId);
  if (modulePath && fs.existsSync(modulePath)) fs.unlinkSync(modulePath);
  return {
    deleted: true,
    restoredBuiltIn: fs.existsSync(path.join(BUNDLED_MODULES_DIR, `${safeId}.json`)),
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    title: 'BRAINROTMAXXING',
    backgroundColor: '#000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      sandbox: false,
    },
  });

  win.loadFile('index.html');
  wirePopupWindows(win.webContents);

  win.webContents.on('did-attach-webview', (_e, wc) => {
    wirePopupWindows(wc);
  });
}

app.on('web-contents-created', (_event, wc) => {
  wirePopupWindows(wc);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  for (const t of terms.values()) {
    try { t.kill(); } catch {}
  }
  terms.clear();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('app:listModules', () => loadModules());
ipcMain.handle('app:ptyAvailable', () => !!pty);
ipcMain.handle('app:userModulesDir', () => {
  const d = userModulesDir();
  try { fs.mkdirSync(d, { recursive: true }); } catch {}
  return d;
});
ipcMain.handle('app:saveModule', (_e, module, previousId) => {
  try {
    return { ok: true, module: saveUserModule(module, previousId) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
ipcMain.handle('app:deleteModule', (_e, id) => {
  try {
    return { ok: true, ...deleteUserModule(id) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
ipcMain.handle('app:webviewPreloadUrl', () => {
  return pathToFileURL(path.join(__dirname, 'webview-preload.js')).toString();
});

ipcMain.handle('app:openLoginWindow', async (_e, url) => {
  const target = url || 'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fwww.youtube.com%2F';
  return openExternalUrl(target);
});

ipcMain.handle('app:openExternal', async (_e, url) => {
  return openExternalUrl(url);
});

ipcMain.handle('app:importChromeCookies', async (_e, options = {}) => {
  const domains = normalizeDomains(options && options.domains);
  if (!domains.length) return { ok: false, error: 'no valid domains supplied' };
  try {
    const res = await importCookiesFromChrome(domains);
    return { ok: true, ...res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

async function importCookiesFromChrome(domainFilters) {
  const cookiesPath = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default/Cookies');
  if (!fs.existsSync(cookiesPath)) {
    throw new Error('Chrome not found at ~/Library/Application Support/Google/Chrome. Install Chrome and sign in to Google there first.');
  }

  let keychainPass;
  try {
    keychainPass = execFileSync(
      '/usr/bin/security',
      ['find-generic-password', '-w', '-s', 'Chrome Safe Storage'],
      { timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] }
    ).toString().trim();
  } catch (e) {
    throw new Error('Keychain access denied. Approve the "Chrome Safe Storage" prompt and try again.');
  }

  const key = crypto.pbkdf2Sync(keychainPass, 'saltysalt', 1003, 16, 'sha1');
  const iv = Buffer.alloc(16, 0x20);

  const tmpPath = path.join(os.tmpdir(), `brainrot-chrome-cookies-${Date.now()}.db`);
  fs.copyFileSync(cookiesPath, tmpPath);

  try {
    const whereClause = cookieWhereForDomains(domainFilters);
    const sql = `SELECT host_key, name, path, hex(encrypted_value) AS ev, expires_utc, is_secure, is_httponly, samesite, has_expires FROM cookies WHERE ${whereClause};`;

    const out = execFileSync(
      '/usr/bin/sqlite3',
      ['-cmd', '.mode json', tmpPath, sql],
      { timeout: 20000 }
    ).toString();

    const rows = out.trim() ? JSON.parse(out) : [];
    const ses = session.fromPartition('persist:main');
    const sameSiteMap = { '-1': 'unspecified', 0: 'no_restriction', 1: 'lax', 2: 'strict' };

    let imported = 0, failed = 0;
    for (const row of rows) {
      try {
        const encBuf = Buffer.from(row.ev, 'hex');
        let value;
        if (encBuf.length >= 3 && encBuf.slice(0, 3).toString() === 'v10') {
          const ciphertext = encBuf.slice(3);
          const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
          value = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
        } else {
          value = encBuf.toString('utf8');
        }

        const host = row.host_key;
        const pureHost = host.replace(/^\./, '');
        const url = `http${row.is_secure ? 's' : ''}://${pureHost}${row.path || '/'}`;

        const params = {
          url,
          name: row.name,
          value,
          path: row.path || '/',
          secure: !!row.is_secure,
          httpOnly: !!row.is_httponly,
          sameSite: sameSiteMap[String(row.samesite)] || 'unspecified',
        };
        if (host.startsWith('.')) params.domain = host;
        if (row.has_expires && row.expires_utc > 0) {
          params.expirationDate = row.expires_utc / 1e6 - 11644473600;
        }

        await ses.cookies.set(params);
        imported++;
      } catch {
        failed++;
      }
    }
    await ses.flushStorageData();
    return { imported, failed, total: rows.length };
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

ipcMain.handle('app:clearSiteCookies', async (_e, domains) => {
  const domainFilters = normalizeDomains(domains, []);
  if (!domainFilters.length) return { removed: 0 };
  const ses = session.fromPartition('persist:main');
  const all = await ses.cookies.get({});
  let removed = 0;
  for (const c of all) {
    const host = (c.domain || '').replace(/^\./, '');
    if (!domainFilters.some(domain => hostMatchesDomain(host, domain))) continue;
    const url = `http${c.secure ? 's' : ''}://${host}${c.path}`;
    try { await ses.cookies.remove(url, c.name); removed++; } catch {}
  }
  return { removed };
});

ipcMain.handle('term:spawn', (_e, id, opts) => {
  const termId = normalizeTermId(id);
  if (!termId) return { ok: false, error: 'invalid terminal id' };

  const existing = terms.get(termId);
  if (existing) {
    try { existing.kill(); } catch {}
    terms.delete(termId);
  }

  const { command, args = [], cwd, cols = 80, rows = 24 } = opts || {};
  if (!command) return { ok: false, error: 'missing command' };

  const env = buildTerminalEnv();
  const cwdPath = safeWorkingDirectory(cwd);
  const commandPath = resolveExecutable(command, env, cwdPath);
  const termArgs = Array.isArray(args) ? args.map(String) : [];
  if (!commandPath) {
    return {
      ok: false,
      error: `executable not found: ${command}. PATH=${env.PATH}`,
    };
  }

  const spawnOptions = {
    name: 'xterm-256color',
    cols: clampInt(cols, 20, 400, 80),
    rows: clampInt(rows, 8, 120, 24),
    cwd: cwdPath,
    env,
  };

  let term;
  let ptyError = null;
  if (pty) {
    try {
      term = makePtyTerminal(pty.spawn(commandPath, termArgs, spawnOptions));
    } catch (directErr) {
      const shellBin = chooseShell();
      const shellCmd = [shellQuote(commandPath), ...termArgs.map(shellQuote)].join(' ');
      try {
        term = makePtyTerminal(pty.spawn(shellBin, ['-l', '-c', shellCmd], spawnOptions));
      } catch (shellErr) {
        ptyError = `${directErr.message}; node-pty shell fallback failed: ${shellErr.message}`;
      }
    }
  } else {
    ptyError = 'node-pty not available';
  }

  if (!term) {
    return {
      ok: false,
      error: `${ptyError}; command=${commandPath}; cwd=${cwdPath}; helper=${path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'node_modules/node-pty/build/Release/spawn-helper')}`,
    };
  }

  terms.set(termId, term);

  term.onData(data => emitTermData(termId, data));
  term.onExit(code => emitTermExit(termId, code));

  return { ok: true, backend: 'node-pty' };
});

ipcMain.on('term:write', (_e, id, data) => {
  const termId = normalizeTermId(id);
  if (!termId || typeof data !== 'string' || data.length > 100000) return;
  const t = terms.get(termId);
  if (t) t.write(data);
});

ipcMain.on('term:resize', (_e, id, cols, rows) => {
  const termId = normalizeTermId(id);
  if (!termId) return;
  const t = terms.get(termId);
  if (t) {
    try { t.resize(clampInt(cols, 20, 400, 80), clampInt(rows, 8, 120, 24)); } catch {}
  }
});

ipcMain.on('term:kill', (_e, id) => {
  const termId = normalizeTermId(id);
  if (!termId) return;
  const t = terms.get(termId);
  if (t) { try { t.kill(); } catch {} terms.delete(termId); }
});
