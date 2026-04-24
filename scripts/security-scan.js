const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function trackedFiles() {
  return git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0')
    .filter(Boolean);
}

const forbiddenPathPatterns = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)cookies?($|\.|\/)/i,
  /(^|\/).*cookie.*\.(db|sqlite|sqlite3)$/i,
  /\.(pem|key|p12|pfx|mobileprovision|provisionprofile)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i,
];

const secretPatterns = [
  { name: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: 'OpenAI-style API key', pattern: /\bsk-[A-Za-z0-9_-]{32,}\b/ },
  { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
];

function isLikelyText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ![
    '.icns',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.pdf',
    '.asar',
  ].includes(ext);
}

const findings = [];

for (const file of trackedFiles()) {
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) {
      findings.push(`${file}: sensitive file path is tracked`);
      break;
    }
  }

  if (!isLikelyText(file)) continue;

  const absPath = path.join(root, file);
  let content;
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    continue;
  }

  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) findings.push(`${file}: possible ${name}`);
  }
}

if (findings.length) {
  console.error('[brainrot] security scan found possible sensitive content:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

const identities = git(['log', '--format=%an <%ae>', '--all'])
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);
const uniqueIdentities = [...new Set(identities)];

console.log(`[brainrot] security scan passed for ${trackedFiles().length} tracked or untracked files`);
if (uniqueIdentities.length) {
  console.log('[brainrot] public commit identities:');
  for (const identity of uniqueIdentities) console.log(`- ${identity}`);
}
