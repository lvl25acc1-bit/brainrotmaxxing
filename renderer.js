const SIZE_CYCLE = [
  { cols: 1, rows: 1 },
  { cols: 2, rows: 1 },
  { cols: 1, rows: 2 },
  { cols: 2, rows: 2 },
  { cols: 3, rows: 2 },
  { cols: 2, rows: 3 },
  { cols: 4, rows: 2 },
];
const LEGACY_SIZES = { S: SIZE_CYCLE[0], M: SIZE_CYCLE[1], T: SIZE_CYCLE[2], L: SIZE_CYCLE[3] };
const SIZES_KEY = 'brainrot:sizes:v2';
const RECTS_KEY = 'brainrot:rects:v1';
const LAYOUT_KEY = 'brainrot:layout:v2';
const MUTES_KEY = 'brainrot:mutes:v1';
const ORDER_KEY = 'brainrot:order:v1';
const SAVED_STATE_KEY_BASE = 'brainrot:saved-state:v1';
const EDIT_MODE_KEY = 'brainrot:edit-mode:v1';
const ACTIVE_SLOT_KEY = 'brainrot:active-slot';
const LAYOUT_SLOT_META_KEY = 'brainrot:layout-slot-meta:v1';
const DEFAULT_LAYOUT_SLOT_COUNT = 4;
const MAX_LAYOUT_SLOTS = 8;
const MIN_TILE_W = 260;
const MIN_TILE_H = 170;
const SNAP_STEP = 12;
const CANVAS_PAD = 8;
const LAYOUT_PRESETS = {
  compact: { columns: 5, rowHeight: 180, gap: 2, locked: true },
  default: { columns: 4, rowHeight: 260, gap: 3, locked: true },
  wide: { columns: 6, rowHeight: 235, gap: 3, locked: true },
  focus: { columns: 3, rowHeight: 310, gap: 3, locked: true },
};
const DEFAULT_SPANS = {
  x: { cols: 1, rows: 2 },
  instagram: { cols: 2, rows: 2 },
  'youtube-shorts': { cols: 2, rows: 2 },
  tiktok: { cols: 1, rows: 2 },
  twitch: { cols: 2, rows: 2 },
  news: { cols: 2, rows: 2 },
  'claude-code': { cols: 2, rows: 2 },
  codex: { cols: 2, rows: 2 },
};

let allModules = [];
const tiles = [];
let sizes = loadSizes();
let tileRects = loadRects();
let layout = loadLayout();
let mutes = loadMutes();
let tileOrder = loadOrder();
let initializing = true;
let webviewPreloadUrl = null;
let editMode = loadEditMode();
let currentSlot = localStorage.getItem(ACTIVE_SLOT_KEY) || '1';
let layoutSlots = loadLayoutSlots();
let focusedTileId = null;
let commandItems = [];
let commandActiveIndex = 0;
let moduleManagerSelectedId = null;
let moduleManagerMode = 'new';

(async function init() {
  [allModules, webviewPreloadUrl] = await Promise.all([
    window.appAPI.listModules(),
    window.appAPI.webviewPreloadUrl(),
  ]);
  const savedState = loadSavedState(currentSlot);
  let startupTiles = tilesFromSavedState(savedState);
  if (!savedState) startupTiles = applyOrderToStartup(startupTiles, tileOrder);
  if (savedState && savedState.layout) layout = normalizeLayout(savedState.layout);
  if (savedState && savedState.sizes) sizes = savedState.sizes;
  if (savedState && savedState.rects) tileRects = savedState.rects;
  if (savedState && savedState.mutes) mutes = savedState.mutes;
  document.body.classList.toggle('is-editing', editMode);
  applyLayout();
  wireToolbar();
  for (const tile of startupTiles) {
    addTile(tile.module, {
      temporary: tile.temporary,
      span: tile.span,
      rect: tile.rect,
      muted: tile.muted,
    });
  }
  fullRerender();
  updateEditButton();
  renderLayoutSlots();
  updateWorkspaceStatus();
  initializing = false;
  saveOrder();
})();

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function defaultLayoutSlots() {
  return Array.from({ length: DEFAULT_LAYOUT_SLOT_COUNT }, (_value, index) => {
    const id = String(index + 1);
    return { id, name: `Layout ${id}`, savedAt: null };
  });
}

function normalizeLayoutSlot(slot, fallbackId) {
  const id = String((slot && slot.id) || fallbackId || '').trim();
  if (!id) return null;
  const fallbackName = `Layout ${id}`;
  const name = String((slot && slot.name) || fallbackName).trim() || fallbackName;
  const savedAt = typeof (slot && slot.savedAt) === 'string' ? slot.savedAt : null;
  return { id, name, savedAt };
}

function loadLayoutSlots() {
  const saved = loadJson(LAYOUT_SLOT_META_KEY, null);
  const slots = [];
  const seen = new Set();
  const source = Array.isArray(saved) ? saved : defaultLayoutSlots();

  for (let i = 0; i < source.length; i++) {
    const slot = normalizeLayoutSlot(source[i], String(i + 1));
    if (!slot || seen.has(slot.id)) continue;
    slots.push(slot);
    seen.add(slot.id);
  }

  for (const slot of defaultLayoutSlots()) {
    if (seen.has(slot.id)) continue;
    slots.push(slot);
    seen.add(slot.id);
  }

  if (!seen.has(currentSlot)) {
    currentSlot = '1';
    localStorage.setItem(ACTIVE_SLOT_KEY, currentSlot);
  }

  return slots
    .sort((a, b) => {
      const an = Number.parseInt(a.id, 10);
      const bn = Number.parseInt(b.id, 10);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      return a.id.localeCompare(b.id);
    })
    .slice(0, MAX_LAYOUT_SLOTS);
}

function saveLayoutSlots() {
  layoutSlots.sort((a, b) => {
    const an = Number.parseInt(a.id, 10);
    const bn = Number.parseInt(b.id, 10);
    if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
    return a.id.localeCompare(b.id);
  });
  localStorage.setItem(LAYOUT_SLOT_META_KEY, JSON.stringify(layoutSlots));
}

function layoutSlotName(slotId) {
  const id = String(slotId || currentSlot);
  const slot = layoutSlots.find(s => s.id === id);
  return slot ? slot.name : `Layout ${id}`;
}

function ensureLayoutSlot(slotId, name = null) {
  const id = String(slotId || '').trim();
  if (!id) return null;
  let slot = layoutSlots.find(s => s.id === id);
  if (!slot) {
    if (layoutSlots.length >= MAX_LAYOUT_SLOTS) return null;
    slot = { id, name: `Layout ${id}`, savedAt: null };
    layoutSlots.push(slot);
  }
  if (name != null) slot.name = String(name).trim() || `Layout ${id}`;
  saveLayoutSlots();
  return slot;
}

function nextLayoutSlotId() {
  const used = new Set(layoutSlots.map(s => Number.parseInt(s.id, 10)).filter(Number.isFinite));
  for (let i = 1; i <= MAX_LAYOUT_SLOTS; i++) {
    if (!used.has(i)) return String(i);
  }
  return null;
}

function loadSizes() {
  return loadJson(SIZES_KEY, {});
}
function saveSizes() {
  localStorage.setItem(SIZES_KEY, JSON.stringify(sizes));
}

function loadEditMode() {
  return localStorage.getItem(EDIT_MODE_KEY) === 'true';
}
function saveEditMode() {
  localStorage.setItem(EDIT_MODE_KEY, String(editMode));
}

function loadRects() {
  return loadJson(RECTS_KEY, {});
}

function saveRects() {
  localStorage.setItem(RECTS_KEY, JSON.stringify(tileRects));
}

function loadMutes() {
  return loadJson(MUTES_KEY, {});
}

function saveMutes() {
  localStorage.setItem(MUTES_KEY, JSON.stringify(mutes));
}

function loadOrder() {
  const value = loadJson(ORDER_KEY, []);
  return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [];
}

function saveOrder() {
  if (initializing) return;
  const ids = tiles.map(t => t.id);
  tileOrder = ids;
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
}

function applyOrderToStartup(startupTiles, order) {
  if (!order || !order.length) return startupTiles;
  const byId = new Map(startupTiles.map(st => [st.module.id, st]));
  const ordered = [];
  for (const id of order) {
    const match = byId.get(id);
    if (match) { ordered.push(match); byId.delete(id); }
  }
  for (const st of byId.values()) ordered.push(st);
  return ordered;
}

function loadSavedState(slot) {
  const slotKey = `${SAVED_STATE_KEY_BASE}:${slot}`;
  let saved = loadJson(slotKey, null);
  
  // Migration for Slot 1 if legacy key exists
  if (!saved && slot === '1') {
    saved = loadJson(SAVED_STATE_KEY_BASE, null);
  }
  
  return saved && Array.isArray(saved.tiles) ? saved : null;
}

function loadLayout() {
  try {
    return normalizeLayout(JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}'));
  } catch {
    return normalizeLayout({});
  }
}

function saveLayout() {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

function normalizeLayout(value) {
  const base = defaultLayoutPreset();
  return {
    columns: clampInt(value.columns, 2, 8, base.columns),
    rowHeight: clampInt(value.rowHeight, 150, 420, base.rowHeight),
    gap: clampInt(value.gap, 0, 8, base.gap),
    locked: value.locked !== false,
    editRefSize: normalizeEditRef(value.editRefSize),
  };
}

function normalizeEditRef(value) {
  if (!value || typeof value !== 'object') return null;
  const w = Number(value.w);
  const h = Number(value.h);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

function defaultLayoutPreset() {
  const width = window.innerWidth || 1600;
  if (width >= 1800) return LAYOUT_PRESETS.wide;
  if (width < 1200) return LAYOUT_PRESETS.focus;
  return LAYOUT_PRESETS.default;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampSpan(span) {
  return {
    cols: clampInt(span && span.cols, 1, layout.columns || 4, 1),
    rows: clampInt(span && span.rows, 1, 6, 1),
  };
}

function clampFloat(value, min, max, fallback) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeSpan(value) {
  if (typeof value === 'string') return clampSpan(LEGACY_SIZES[value] || LEGACY_SIZES.S);
  return clampSpan(value || LEGACY_SIZES.S);
}

function defaultSpanFor(mod) {
  if (!mod) return LEGACY_SIZES.S;
  if (mod.defaultSpan) return normalizeSpan(mod.defaultSpan);
  if (DEFAULT_SPANS[mod.id]) return DEFAULT_SPANS[mod.id];
  if (mod.type === 'terminal') return { cols: 2, rows: 2 };
  if (mod.type === 'webview-tabs') return { cols: 2, rows: 2 };
  return { cols: 1, rows: 2 };
}

function spanLabel(span) {
  return `${span.cols}×${span.rows}`;
}

function rectLabel(rect) {
  if (!rect) return 'size';
  return `${Math.round(rect.w)}×${Math.round(rect.h)}`;
}

function normalizeRect(value, fallback) {
  const base = fallback || { x: CANVAS_PAD, y: CANVAS_PAD, w: 520, h: 360 };
  return {
    x: clampFloat(value && value.x, 0, 100000, base.x),
    y: clampFloat(value && value.y, 0, 100000, base.y),
    w: clampFloat(value && value.w, MIN_TILE_W, 6000, base.w),
    h: clampFloat(value && value.h, MIN_TILE_H, 4000, base.h),
  };
}

function gridRect() {
  const grid = document.getElementById('grid');
  if (!grid) return { width: window.innerWidth || 1600, height: window.innerHeight || 900 };
  return {
    width: Math.max(grid.clientWidth, 900),
    height: Math.max(grid.clientHeight, 620),
  };
}

function rectFromSpan(span) {
  const bounds = gridRect();
  const cols = layout.columns || 4;
  const gap = layout.gap || 3;
  const colW = Math.max(MIN_TILE_W, (bounds.width - gap * (cols + 1)) / cols);
  const normalized = clampSpan(span || LEGACY_SIZES.S);
  return {
    w: Math.max(MIN_TILE_W, colW * normalized.cols + gap * (normalized.cols - 1)),
    h: Math.max(MIN_TILE_H, layout.rowHeight * normalized.rows + gap * (normalized.rows - 1)),
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function findOpenRect(span, placed = tiles) {
  const bounds = gridRect();
  const cols = layout.columns || 4;
  const gap = layout.gap || 3;
  const size = rectFromSpan(span);
  const stepX = Math.max(160, (bounds.width - CANVAS_PAD * 2) / cols);
  const stepY = Math.max(120, layout.rowHeight + gap);
  const existing = placed
    .map(item => item.rect)
    .filter(Boolean);

  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < cols; col++) {
      const candidate = normalizeRect({
        x: CANVAS_PAD + col * stepX,
        y: CANVAS_PAD + row * stepY,
        w: size.w,
        h: size.h,
      });
      if (candidate.x + candidate.w > bounds.width - CANVAS_PAD && col > 0) continue;
      if (!existing.some(r => rectsOverlap(candidate, r))) return candidate;
    }
  }

  return normalizeRect({
    x: CANVAS_PAD,
    y: CANVAS_PAD + existing.reduce((max, r) => Math.max(max, r.y + r.h), 0),
    w: size.w,
    h: size.h,
  });
}

function snapValue(value) {
  if (!layout.locked) return value;
  return Math.round(value / SNAP_STEP) * SNAP_STEP;
}

function snapRect(rect) {
  if (!layout.locked) return rect;
  return normalizeRect({
    x: snapValue(rect.x),
    y: snapValue(rect.y),
    w: snapValue(rect.w),
    h: snapValue(rect.h),
  }, rect);
}

function tilesFromSavedState(savedState) {
  if (!savedState) {
    return allModules.map(module => ({ module, temporary: false }));
  }

  const coreById = new Map(allModules.map(module => [module.id, module]));
  const restored = [];
  for (const savedTile of savedState.tiles) {
    const coreModule = coreById.get(savedTile.id);
    const savedModule = savedTile.module && typeof savedTile.module === 'object'
      ? savedTile.module
      : null;
    const module = coreModule
      ? { ...coreModule }
      : (savedModule ? { ...savedModule } : null);
    if (!module || !module.id) continue;
    if (module.type === 'app') continue;
    if (savedTile.currentUrl && (module.type === 'webview' || module.type === 'webview-tabs')) {
      module.startUrl = savedTile.currentUrl;
    }
    restored.push({
      module,
      temporary: !coreModule || !!savedTile.temporary,
      span: savedTile.span,
      rect: savedTile.rect,
      muted: savedTile.muted,
    });
  }

  return restored.length
    ? restored
    : allModules.map(module => ({ module, temporary: false }));
}

function wireToolbar() {
  document.getElementById('add-tile-btn').addEventListener('click', toggleAddMenu);
  document.getElementById('layout-btn').addEventListener('click', toggleLayoutMenu);
  document.getElementById('reset-btn').addEventListener('click', resetSizes);
  document.getElementById('save-layout-btn').addEventListener('click', toggleSaveLayoutMenu);
  document.getElementById('edit-mode-btn').addEventListener('click', () => setEditMode(!editMode));
  document.getElementById('cancel-edit-btn').addEventListener('click', cancelEditMode);
  document.getElementById('module-manager-btn').addEventListener('click', () => openModuleManager());
  document.getElementById('module-manager-close-btn').addEventListener('click', closeModuleManager);
  document.getElementById('module-manager').addEventListener('click', e => {
    if (e.target.id === 'module-manager') closeModuleManager();
  });
  document.getElementById('module-manager-search').addEventListener('input', renderModuleManagerList);
  document.getElementById('module-manager-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-module-id]');
    if (btn) selectModuleForEdit(btn.dataset.moduleId);
  });
  document.getElementById('module-new-btn').addEventListener('click', () => selectNewModule());
  document.getElementById('module-type').addEventListener('change', syncModuleTypeFields);
  document.getElementById('module-name').addEventListener('input', syncNewModuleIdFromName);
  document.getElementById('module-id').addEventListener('input', e => { e.target.dataset.touched = 'true'; });
  document.getElementById('module-form').addEventListener('submit', saveModuleFromForm);
  document.getElementById('module-delete-btn').addEventListener('click', deleteSelectedModule);
  document.getElementById('module-duplicate-btn').addEventListener('click', duplicateSelectedModule);
  document.getElementById('command-palette-btn').addEventListener('click', () => openCommandPalette());
  document.getElementById('command-close-btn').addEventListener('click', closeCommandPalette);
  document.getElementById('command-query').addEventListener('input', e => renderCommandList(e.target.value));
  document.getElementById('command-query').addEventListener('keydown', handleCommandKeydown);
  document.getElementById('command-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-command-index]');
    if (!btn) return;
    runCommandItem(Number(btn.dataset.commandIndex));
  });
  document.getElementById('command-palette').addEventListener('click', e => {
    if (e.target.id === 'command-palette') closeCommandPalette();
  });
  window.addEventListener('keydown', handleGlobalKeydown);
  document.getElementById('layout-tabs').addEventListener('click', e => {
    const btn = e.target.closest('button[data-layout-slot]');
    if (btn) switchSlot(btn.dataset.layoutSlot);
  });
  document.getElementById('layout-slot-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-layout-slot]');
    if (btn) switchSlot(btn.dataset.layoutSlot);
  });
  document.getElementById('chrome-import-btn').addEventListener('click', async () => {
    const ok = await confirmAction({
      title: 'Import Chrome cookies',
      message: 'Quit Chrome first so its cookie database is not locked. macOS may ask for Keychain access to decrypt the local Chrome cookie store. Cookies are copied into this app only.',
      confirmLabel: 'Import',
    });
    if (!ok) return;
    showToast('Importing Chrome cookies...');
    const r = await window.appAPI.importChromeCookies();
    if (!r.ok) {
      showToast(`Import failed: ${r.error}`, 'error');
      return;
    }
    showToast(`Imported ${r.imported} of ${r.total} cookies${r.failed ? ` (${r.failed} failed)` : ''}. Reloading tiles.`);
    for (const t of tiles) {
      if (t.module.type === 'terminal') continue;
      const wv = t.element.querySelector('webview');
      if (wv) wv.reload();
    }
  });

  const urlInput = document.getElementById('quick-url');
  const urlBtn = document.getElementById('quick-url-btn');
  const cmdInput = document.getElementById('quick-cmd');
  const cmdBtn = document.getElementById('quick-cmd-btn');
  const moduleSearch = document.getElementById('module-search');
  const saveNameInput = document.getElementById('layout-save-name');
  const saveSlotSelect = document.getElementById('layout-save-slot');
  const saveSlotBtn = document.getElementById('save-slot-btn');
  const newSlotBtn = document.getElementById('new-slot-btn');

  const quickAddUrl = () => {
    const raw = urlInput.value.trim();
    if (!raw) return;
    const url = normalizeWebUrl(raw);
    if (!url) {
      showToast('Enter a valid http or https URL.', 'error');
      return;
    }
    addTile({
      id: `temp-${Date.now()}`,
      name: hostOf(url),
      type: 'webview',
      url,
    }, { temporary: true });
    urlInput.value = '';
    closeAddMenu();
  };
  const quickAddCmd = () => {
    const raw = cmdInput.value.trim();
    if (!raw) return;
    const parts = parseCommandLine(raw);
    if (!parts || parts.length === 0) {
      showToast('Command has an unclosed quote.', 'error');
      return;
    }
    addTile({
      id: `temp-${Date.now()}`,
      name: parts[0],
      type: 'terminal',
      command: parts[0],
      args: parts.slice(1),
    }, { temporary: true });
    cmdInput.value = '';
    closeAddMenu();
  };

  urlBtn.addEventListener('click', quickAddUrl);
  cmdBtn.addEventListener('click', quickAddCmd);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') quickAddUrl(); });
  cmdInput.addEventListener('keydown', e => { if (e.key === 'Enter') quickAddCmd(); });
  moduleSearch.addEventListener('input', () => renderClosedList());

  saveSlotSelect.addEventListener('change', () => {
    saveNameInput.value = layoutSlotName(saveSlotSelect.value);
    saveNameInput.select();
  });
  saveSlotBtn.addEventListener('click', () => saveLayoutFromMenu());
  saveNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveLayoutFromMenu(); });
  newSlotBtn.addEventListener('click', () => {
    const nextId = nextLayoutSlotId();
    if (!nextId) {
      showToast(`You can save up to ${MAX_LAYOUT_SLOTS} layout slots.`, 'error');
      return;
    }
    ensureLayoutSlot(nextId);
    renderLayoutSlots();
    syncSaveLayoutMenu();
    saveSlotSelect.value = nextId;
    saveNameInput.value = `Layout ${nextId}`;
    saveNameInput.focus();
    saveNameInput.select();
  });

  const lockedInput = document.getElementById('layout-locked');
  const columnsInput = document.getElementById('layout-columns');
  const rowHeightInput = document.getElementById('layout-row-height');
  lockedInput.addEventListener('change', () => {
    layout.locked = lockedInput.checked;
    applyLayout({ persist: true });
  });
  columnsInput.addEventListener('change', () => {
    layout.columns = clampInt(columnsInput.value, 2, 8, layout.columns);
    applyLayout({ persist: true, normalizeTiles: true });
  });
  rowHeightInput.addEventListener('change', () => {
    layout.rowHeight = clampInt(rowHeightInput.value, 150, 420, layout.rowHeight);
    applyLayout({ persist: true });
  });
  document.querySelectorAll('[data-layout-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLayoutPreset(btn.dataset.layoutPreset);
    });
  });

  document.addEventListener('click', e => {
    const addMenu = document.getElementById('add-menu');
    if (!addMenu.classList.contains('hidden') && !addMenu.contains(e.target) && e.target.id !== 'add-tile-btn') {
      closeAddMenu();
    }
    const saveMenu = document.getElementById('save-layout-menu');
    if (!saveMenu.classList.contains('hidden') && !saveMenu.contains(e.target) && e.target.id !== 'save-layout-btn') {
      closeSaveLayoutMenu();
    }
    const layoutMenu = document.getElementById('layout-menu');
    if (!layoutMenu.classList.contains('hidden') && !layoutMenu.contains(e.target) && e.target.id !== 'layout-btn') {
      closeLayoutMenu();
    }
  });

  window.addEventListener('resize', () => updateCanvasExtent());
}

function renderLayoutSlots() {
  const tabRoot = document.getElementById('layout-tabs');
  const listRoot = document.getElementById('layout-slot-list');
  if (tabRoot) tabRoot.innerHTML = '';
  if (listRoot) listRoot.innerHTML = '';

  for (const slot of layoutSlots) {
    if (tabRoot) {
      const tab = document.createElement('button');
      tab.dataset.layoutSlot = slot.id;
      tab.className = 'layout-tab';
      tab.textContent = slot.name;
      tab.title = `Switch to ${slot.name}`;
      tab.classList.toggle('active', slot.id === currentSlot);
      tabRoot.appendChild(tab);
    }

    if (listRoot) {
      const item = document.createElement('button');
      item.dataset.layoutSlot = slot.id;
      item.className = 'slot-list-btn';
      item.textContent = slot.name;
      item.title = slot.savedAt ? `Saved ${new Date(slot.savedAt).toLocaleString()}` : 'Empty layout slot';
      item.classList.toggle('active', slot.id === currentSlot);
      listRoot.appendChild(item);
    }
  }

  syncSaveLayoutMenu();
  updateWorkspaceStatus();
}

function syncSaveLayoutMenu() {
  const select = document.getElementById('layout-save-slot');
  const nameInput = document.getElementById('layout-save-name');
  if (!select || !nameInput) return;

  const selected = select.value || currentSlot;
  select.innerHTML = '';
  for (const slot of layoutSlots) {
    const option = document.createElement('option');
    option.value = slot.id;
    option.textContent = `${slot.id}: ${slot.name}`;
    select.appendChild(option);
  }

  select.value = layoutSlots.some(slot => slot.id === selected) ? selected : currentSlot;
  nameInput.value = layoutSlotName(select.value);
}

function saveLayoutFromMenu() {
  const select = document.getElementById('layout-save-slot');
  const nameInput = document.getElementById('layout-save-name');
  const slotId = select.value || currentSlot;
  const name = nameInput.value.trim() || `Layout ${slotId}`;
  saveLayoutToSlot(slotId, name);
  closeSaveLayoutMenu();
}

function saveLayoutToSlot(slotId, name) {
  const slot = ensureLayoutSlot(slotId, name);
  if (!slot) {
    showToast(`You can save up to ${MAX_LAYOUT_SLOTS} layout slots.`, 'error');
    return;
  }

  currentSlot = slot.id;
  localStorage.setItem(ACTIVE_SLOT_KEY, currentSlot);
  slot.name = String(name || slot.name).trim() || `Layout ${slot.id}`;
  saveLayoutSlots();
  saveCurrentState({ silent: true, slot: currentSlot, name: slot.name });
  renderLayoutSlots();
  flashSaveButton(`Saved: ${slot.name}`);
}

async function switchSlot(slotId) {
  const slot = ensureLayoutSlot(slotId);
  if (!slot) return;
  if (slotId === currentSlot) return;

  saveCurrentState({ silent: true });
  restoreSlot(slot.id);
}

function restoreSlot(slotId) {
  const slot = ensureLayoutSlot(slotId);
  if (!slot) return;

  while (tiles.length > 0) {
    removeTile(tiles[0].id);
  }

  currentSlot = slot.id;
  localStorage.setItem(ACTIVE_SLOT_KEY, currentSlot);
  renderLayoutSlots();

  const savedState = loadSavedState(currentSlot);
  let startupTiles = tilesFromSavedState(savedState);

  if (savedState && savedState.layout) layout = normalizeLayout(savedState.layout);
  else layout = normalizeLayout({});

  if (savedState && savedState.sizes) sizes = savedState.sizes;
  else sizes = {};

  if (savedState && savedState.rects) tileRects = savedState.rects;
  else tileRects = {};

  if (savedState && savedState.mutes) mutes = savedState.mutes;
  else mutes = {};

  saveSizes();
  saveRects();
  saveMutes();
  saveLayout();
  applyLayout();

  for (const tile of startupTiles) {
    addTile(tile.module, {
      temporary: tile.temporary,
      span: tile.span,
      rect: tile.rect,
      muted: tile.muted,
    });
  }

  fullRerender();
  saveOrder();
}

function applyLayout({ persist = false, normalizeTiles = false } = {}) {
  const grid = document.getElementById('grid');
  if (!grid) return;

  layout = normalizeLayout(layout);
  grid.style.setProperty('--grid-cols', String(layout.columns));
  grid.style.setProperty('--grid-row-h', `${layout.rowHeight}px`);
  grid.style.setProperty('--grid-gap', `${layout.gap}px`);
  grid.classList.toggle('raster-unlocked', !layout.locked);
  grid.classList.add('freeform-grid');

  document.getElementById('layout-locked')?.toggleAttribute('checked', layout.locked);
  const lockedInput = document.getElementById('layout-locked');
  const columnsInput = document.getElementById('layout-columns');
  const rowHeightInput = document.getElementById('layout-row-height');
  if (lockedInput) lockedInput.checked = layout.locked;
  if (columnsInput) columnsInput.value = layout.columns;
  if (rowHeightInput) rowHeightInput.value = layout.rowHeight;

  if (normalizeTiles) {
    for (const t of tiles) setRect(t.id, snapRect(t.rect), { persist: true });
  }
  updateCanvasExtent();
  if (persist) saveLayout();
  updateWorkspaceStatus();
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function normalizeWebUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseCommandLine(raw) {
  const input = String(raw || '').trim();
  if (!input) return [];

  const parts = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const ch of input) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && quote !== "'") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (escaped) current += '\\';
  if (quote) return null;
  if (current) parts.push(current);
  return parts;
}

function showToast(message, type = 'info') {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-root';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    document.body.appendChild(root);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = String(message || '');
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('toast-out');
    window.setTimeout(() => toast.remove(), 180);
  }, type === 'error' ? 4200 : 2400);
}

function confirmAction({
  title = 'Continue?',
  message = '',
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
} = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    const heading = document.createElement('div');
    heading.className = 'confirm-title';
    heading.textContent = title;

    const body = document.createElement('div');
    body.className = 'confirm-body';
    body.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'confirm-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = cancelLabel;

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'primary';
    confirm.textContent = confirmLabel;

    actions.append(cancel, confirm);
    dialog.append(heading, body, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const finish = value => {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      resolve(value);
    };
    const onKeydown = e => {
      if (e.key === 'Escape') finish(false);
    };

    overlay.addEventListener('click', e => {
      if (e.target === overlay) finish(false);
    });
    cancel.addEventListener('click', () => finish(false));
    confirm.addEventListener('click', () => finish(true));
    document.addEventListener('keydown', onKeydown);
    confirm.focus();
  });
}

function isTypingTarget(target) {
  return !!(target && typeof target.closest === 'function' &&
    target.closest('input, textarea, select, [contenteditable="true"]'));
}

function moduleTypeLabel(mod) {
  if (!mod) return 'Tile';
  if (mod.type === 'terminal') return 'Terminal';
  if (mod.type === 'webview-tabs') return 'Tabbed web';
  if (mod.type === 'webview') return 'Web';
  return mod.type || 'Tile';
}

function commandMatches(item, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.title,
    item.meta,
    item.group,
    item.keywords,
  ].filter(Boolean).join(' ').toLowerCase();
  return q.split(/\s+/).every(part => haystack.includes(part));
}

function commandButtonText(item) {
  const parts = [item.group, item.meta].filter(Boolean);
  return parts.length ? `${item.title} · ${parts.join(' · ')}` : item.title;
}

function buildCommandItems(query = '') {
  const visibleIds = new Set(tiles.map(t => t.id));
  const items = [
    {
      group: 'Action',
      title: 'Add tile',
      meta: 'Open module and quick-add menu',
      keywords: 'new web terminal module',
      run: () => {
        closeCommandPalette();
        openAddMenu();
      },
    },
    {
      group: 'Action',
      title: 'Manage modules',
      meta: 'Create, edit, duplicate, delete',
      keywords: 'module manager json custom tile',
      run: () => {
        closeCommandPalette();
        openModuleManager();
      },
    },
    {
      group: 'Action',
      title: editMode ? 'Exit edit mode' : 'Enter edit mode',
      meta: 'Drag and resize tiles',
      keywords: 'edit canvas move resize',
      run: () => {
        closeCommandPalette();
        setEditMode(!editMode);
      },
    },
    {
      group: 'Action',
      title: 'Save current layout',
      meta: layoutSlotName(currentSlot),
      keywords: 'save slot persist',
      run: () => {
        closeCommandPalette();
        saveCurrentState();
      },
    },
    {
      group: 'Action',
      title: 'Reload all web tiles',
      meta: `${tiles.filter(t => t.module.type !== 'terminal').length} web tiles`,
      keywords: 'refresh reload browser',
      run: () => {
        closeCommandPalette();
        reloadAllWebTiles();
      },
    },
    {
      group: 'Action',
      title: 'Mute all web tiles',
      meta: 'Audio off',
      keywords: 'sound audio quiet',
      run: () => {
        closeCommandPalette();
        setAllWebTilesMuted(true);
      },
    },
    {
      group: 'Action',
      title: 'Unmute all web tiles',
      meta: 'Audio on',
      keywords: 'sound audio',
      run: () => {
        closeCommandPalette();
        setAllWebTilesMuted(false);
      },
    },
  ];

  if (focusedTileId) {
    items.push({
      group: 'Action',
      title: 'Exit focus mode',
      meta: tiles.find(t => t.id === focusedTileId)?.module.name || focusedTileId,
      keywords: 'focus fullscreen maximize',
      run: () => {
        closeCommandPalette();
        setFocusedTile(null);
      },
    });
  }

  for (const key of Object.keys(LAYOUT_PRESETS)) {
    items.push({
      group: 'Preset',
      title: `Use ${key} layout`,
      meta: `${LAYOUT_PRESETS[key].columns} columns`,
      keywords: 'layout preset grid',
      run: () => {
        closeCommandPalette();
        applyLayoutPreset(key);
      },
    });
  }

  for (const slot of layoutSlots) {
    items.push({
      group: 'Layout',
      title: slot.id === currentSlot ? `${slot.name} (current)` : slot.name,
      meta: slot.savedAt ? `Saved ${new Date(slot.savedAt).toLocaleString()}` : 'Empty slot',
      keywords: `slot ${slot.id} workspace`,
      run: () => {
        closeCommandPalette();
        switchSlot(slot.id);
      },
    });
  }

  for (const t of tiles) {
    items.push({
      group: 'Open tile',
      title: modDisplayName(t.module, t.temporary),
      meta: moduleTypeLabel(t.module),
      keywords: 'focus tile maximize open',
      run: () => {
        closeCommandPalette();
        setFocusedTile(t.id);
      },
    });
  }

  for (const mod of allModules.filter(m => !visibleIds.has(m.id))) {
    items.push({
      group: 'Closed tile',
      title: mod.name || mod.id,
      meta: moduleTypeLabel(mod),
      keywords: 'add restore module',
      run: () => {
        closeCommandPalette();
        addTile(mod);
        showToast(`Added ${mod.name || mod.id}.`);
      },
    });
  }

  return items.filter(item => commandMatches(item, query)).slice(0, 80);
}

function openCommandPalette(query = '') {
  closeAddMenu();
  closeLayoutMenu();
  closeSaveLayoutMenu();
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('command-query');
  palette.classList.remove('hidden');
  input.value = query;
  renderCommandList(query);
  setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}

function closeCommandPalette() {
  document.getElementById('command-palette').classList.add('hidden');
}

function renderCommandList(query = '') {
  const list = document.getElementById('command-list');
  commandActiveIndex = 0;
  commandItems = buildCommandItems(query);
  commandActiveIndex = Math.min(commandActiveIndex, Math.max(commandItems.length - 1, 0));
  list.innerHTML = '';

  if (!commandItems.length) {
    const empty = document.createElement('div');
    empty.className = 'command-empty';
    empty.textContent = 'No matching action.';
    list.appendChild(empty);
    return;
  }

  commandItems.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.commandIndex = String(index);
    btn.className = 'command-item';
    btn.classList.toggle('active', index === commandActiveIndex);

    const title = document.createElement('span');
    title.className = 'command-item-title';
    title.textContent = item.title;

    const meta = document.createElement('span');
    meta.className = 'command-item-meta';
    meta.textContent = [item.group, item.meta].filter(Boolean).join(' · ');

    btn.title = commandButtonText(item);
    btn.append(title, meta);
    list.appendChild(btn);
  });
}

function updateCommandActive(delta) {
  if (!commandItems.length) return;
  commandActiveIndex = (commandActiveIndex + delta + commandItems.length) % commandItems.length;
  document.querySelectorAll('.command-item').forEach((btn, index) => {
    btn.classList.toggle('active', index === commandActiveIndex);
    if (index === commandActiveIndex) btn.scrollIntoView({ block: 'nearest' });
  });
}

function handleCommandKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeCommandPalette();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    updateCommandActive(1);
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    updateCommandActive(-1);
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    runCommandItem(commandActiveIndex);
  }
}

function runCommandItem(index) {
  const item = commandItems[index];
  if (!item) return;
  item.run();
}

function handleGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }

  if (e.key === 'Escape') {
    if (!document.getElementById('module-manager').classList.contains('hidden')) {
      closeModuleManager();
      return;
    }
    if (!document.getElementById('command-palette').classList.contains('hidden')) {
      closeCommandPalette();
      return;
    }
    if (focusedTileId) {
      setFocusedTile(null);
      return;
    }
    const hadMenuOpen = !document.getElementById('add-menu').classList.contains('hidden') ||
      !document.getElementById('save-layout-menu').classList.contains('hidden') ||
      !document.getElementById('layout-menu').classList.contains('hidden');
    closeAddMenu();
    closeSaveLayoutMenu();
    closeLayoutMenu();
    if (!hadMenuOpen && editMode) setEditMode(false);
    return;
  }

  if (isTypingTarget(e.target)) return;

  if (e.key.toLowerCase() === 'f' && tiles.length) {
    const focused = focusedTileId ? null : (tiles[tiles.length - 1] && tiles[tiles.length - 1].id);
    setFocusedTile(focused);
  }

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveCurrentState();
  }

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    setEditMode(!editMode);
  }
}

function toggleAddMenu() {
  const menu = document.getElementById('add-menu');
  const wasHidden = menu.classList.contains('hidden');
  if (wasHidden) openAddMenu();
  else closeAddMenu();
}

function openAddMenu() {
  const menu = document.getElementById('add-menu');
  menu.classList.remove('hidden');
  closeLayoutMenu();
  closeSaveLayoutMenu();
  renderClosedList();
  setTimeout(() => {
    const search = document.getElementById('module-search');
    if (search) {
      search.focus();
      search.select();
    }
  }, 0);
}

function closeAddMenu() {
  document.getElementById('add-menu').classList.add('hidden');
}

function toggleLayoutMenu() {
  const menu = document.getElementById('layout-menu');
  menu.classList.toggle('hidden');
  closeAddMenu();
  closeSaveLayoutMenu();
  renderLayoutSlots();
  applyLayout();
}

function closeLayoutMenu() {
  document.getElementById('layout-menu').classList.add('hidden');
}

function toggleSaveLayoutMenu() {
  const menu = document.getElementById('save-layout-menu');
  const wasHidden = menu.classList.contains('hidden');
  menu.classList.toggle('hidden');
  closeAddMenu();
  closeLayoutMenu();
  if (wasHidden) {
    syncSaveLayoutMenu();
    const nameInput = document.getElementById('layout-save-name');
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 0);
  }
}

function closeSaveLayoutMenu() {
  document.getElementById('save-layout-menu').classList.add('hidden');
}

function renderClosedList() {
  const list = document.getElementById('closed-tiles-list');
  list.innerHTML = '';
  const visibleIds = new Set(tiles.map(t => t.id));
  const search = String(document.getElementById('module-search')?.value || '').trim().toLowerCase();
  const closed = allModules.filter(m => {
    if (visibleIds.has(m.id)) return false;
    if (!search) return true;
    return [m.name, m.id, m.type, m.url, m.command]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search);
  });
  if (closed.length === 0) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = search ? 'No matching closed tile.' : 'All core tiles are open.';
    list.appendChild(d);
    return;
  }
  for (const m of closed) {
    const b = document.createElement('button');
    b.className = 'closed-tile-btn';
    const name = document.createElement('span');
    name.className = 'closed-tile-name';
    name.textContent = m.name || m.id;
    const meta = document.createElement('span');
    meta.className = 'closed-tile-meta';
    meta.textContent = moduleTypeLabel(m);
    b.append(name, meta);
    b.title = `Add ${m.name || m.id}`;
    b.addEventListener('click', () => { addTile(m); closeAddMenu(); });
    list.appendChild(b);
  }
}

function modDisplayName(mod, temporary = false) {
  return `${temporary ? 'Temporary: ' : ''}${mod && (mod.name || mod.id) || 'Tile'}`;
}

function applyLayoutPreset(key) {
  layout = normalizeLayout(LAYOUT_PRESETS[key] || LAYOUT_PRESETS.default);
  applyLayout({ persist: true, normalizeTiles: true });
  showToast(`Layout preset applied: ${key}.`);
}

function reloadAllWebTiles() {
  let count = 0;
  for (const t of tiles) {
    const wv = t.element && t.element.querySelector('webview');
    if (!wv) continue;
    try {
      wv.reload();
      count++;
    } catch {}
  }
  showToast(count ? `Reloading ${count} web tile${count === 1 ? '' : 's'}.` : 'No web tiles to reload.');
}

function setAllWebTilesMuted(muted) {
  let count = 0;
  for (const t of tiles) {
    if (t.module.type === 'terminal') continue;
    setTileMuted(t, muted);
    count++;
  }
  showToast(count ? `${muted ? 'Muted' : 'Unmuted'} ${count} web tile${count === 1 ? '' : 's'}.` : 'No web tiles to update.');
  updateWorkspaceStatus();
}

function setFocusedTile(id) {
  const nextId = id && tiles.some(t => t.id === id) ? id : null;
  focusedTileId = nextId;
  document.body.classList.toggle('is-focused', !!focusedTileId);
  for (const t of tiles) {
    const active = t.id === focusedTileId;
    if (t.element) {
      t.element.classList.toggle('is-focused-tile', active);
      t.element.classList.toggle('is-muted-by-focus', !!focusedTileId && !active);
    }
    if (t.focusBtn) {
      t.focusBtn.textContent = active ? '⤡' : '⛶';
      t.focusBtn.title = active ? 'Exit focus mode' : 'Focus this tile';
      t.focusBtn.setAttribute('aria-label', t.focusBtn.title);
    }
  }
  if (focusedTileId) {
    const focused = tiles.find(t => t.id === focusedTileId);
    bringToFront(focused);
    showToast(`Focused ${focused.module.name || focused.id}. Press Esc to exit.`);
  }
  updateWorkspaceStatus();
}

function updateWorkspaceStatus() {
  const layoutEl = document.getElementById('status-layout');
  const tilesEl = document.getElementById('status-tiles');
  const modeEl = document.getElementById('status-mode');
  if (layoutEl) layoutEl.textContent = `${layoutSlotName(currentSlot)} · ${layout.columns} cols`;
  if (tilesEl) {
    const webCount = tiles.filter(t => t.module.type !== 'terminal').length;
    const termCount = tiles.length - webCount;
    tilesEl.textContent = `${tiles.length} tiles · ${webCount} web · ${termCount} term`;
  }
  if (modeEl) {
    const focusName = focusedTileId
      ? tiles.find(t => t.id === focusedTileId)?.module.name || focusedTileId
      : null;
    modeEl.textContent = focusName
      ? `Focus: ${focusName}`
      : `${editMode ? 'Editing' : 'Live'} · ${layout.locked ? 'snap on' : 'free move'}`;
  }
}

function moduleById(id) {
  return allModules.find(module => module.id === id) || null;
}

function moduleSourceLabel(module) {
  if (!module) return 'New';
  if (module._source === 'custom') return 'Custom';
  if (module._source === 'override') return 'Override';
  return 'Built-in';
}

function moduleSourceClass(module) {
  if (!module) return 'source-new';
  return `source-${module._source || 'bundled'}`;
}

function slugifyClientId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function moduleArgsToLine(args) {
  if (!Array.isArray(args)) return '';
  return args.map(arg => {
    const value = String(arg);
    if (!value) return '';
    return /\s|["'\\]/.test(value) ? JSON.stringify(value) : value;
  }).filter(Boolean).join(' ');
}

function setModuleFormError(message = '') {
  const el = document.getElementById('module-form-error');
  if (!el) return;
  el.hidden = !message;
  el.textContent = message;
}

function openModuleManager(moduleId = null) {
  closeAddMenu();
  closeLayoutMenu();
  closeSaveLayoutMenu();
  closeCommandPalette();
  document.getElementById('module-manager').classList.remove('hidden');
  renderModuleManagerList();
  if (moduleId && moduleById(moduleId)) selectModuleForEdit(moduleId);
  else if (moduleManagerSelectedId && moduleById(moduleManagerSelectedId)) selectModuleForEdit(moduleManagerSelectedId);
  else selectNewModule();
  setTimeout(() => document.getElementById('module-manager-search').focus(), 0);
}

function closeModuleManager() {
  document.getElementById('module-manager').classList.add('hidden');
}

function renderModuleManagerList() {
  const root = document.getElementById('module-manager-list');
  if (!root) return;
  const query = String(document.getElementById('module-manager-search')?.value || '').trim().toLowerCase();
  const modules = allModules.filter(module => {
    if (!query) return true;
    return [module.name, module.id, module.type, module.category, module.url, module.command]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  root.innerHTML = '';
  if (!modules.length) {
    const empty = document.createElement('div');
    empty.className = 'manager-empty';
    empty.textContent = 'No modules found.';
    root.appendChild(empty);
    return;
  }

  for (const module of modules) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.moduleId = module.id;
    btn.className = `manager-list-item ${moduleSourceClass(module)}`;
    btn.classList.toggle('active', module.id === moduleManagerSelectedId && moduleManagerMode === 'edit');

    const title = document.createElement('span');
    title.className = 'manager-list-title';
    title.textContent = `${module.icon ? `${module.icon} ` : ''}${module.name || module.id}`;

    const meta = document.createElement('span');
    meta.className = 'manager-list-meta';
    meta.textContent = `${moduleTypeLabel(module)} · ${moduleSourceLabel(module)}${module.category ? ` · ${module.category}` : ''}`;

    btn.append(title, meta);
    root.appendChild(btn);
  }
}

function selectNewModule(seed = {}) {
  moduleManagerSelectedId = null;
  moduleManagerMode = 'new';
  const module = {
    id: '',
    name: '',
    type: 'webview',
    url: '',
    order: 99,
    defaultSpan: { cols: 2, rows: 2 },
    ...seed,
  };
  fillModuleForm(module);
  renderModuleManagerList();
  setTimeout(() => document.getElementById('module-name').focus(), 0);
}

function selectModuleForEdit(moduleId) {
  const module = moduleById(moduleId);
  if (!module) return;
  moduleManagerSelectedId = module.id;
  moduleManagerMode = 'edit';
  fillModuleForm(module);
  renderModuleManagerList();
}

function fillModuleForm(module) {
  setModuleFormError('');
  const idInput = document.getElementById('module-id');
  idInput.dataset.touched = moduleManagerMode === 'edit' ? 'true' : '';
  document.getElementById('module-name').value = module.name || '';
  idInput.value = module.id || '';
  document.getElementById('module-type').value = module.type || 'webview';
  document.getElementById('module-category').value = module.category || '';
  document.getElementById('module-icon').value = module.icon || '';
  document.getElementById('module-order').value = module.order ?? 99;
  document.getElementById('module-cols').value = module.defaultSpan?.cols || defaultSpanFor(module).cols || 2;
  document.getElementById('module-rows').value = module.defaultSpan?.rows || defaultSpanFor(module).rows || 2;
  document.getElementById('module-url').value = module.url || '';
  document.getElementById('module-tabs').value = Array.isArray(module.tabs)
    ? module.tabs.map(tab => `${tab.label} | ${tab.url}`).join('\n')
    : '';
  document.getElementById('module-command').value = module.command || '';
  document.getElementById('module-args').value = moduleArgsToLine(module.args);
  document.getElementById('module-cwd').value = module.cwd || '';

  const subtitle = document.getElementById('module-manager-subtitle');
  subtitle.textContent = moduleManagerMode === 'new'
    ? 'New module'
    : `${module.id} · ${moduleTypeLabel(module)} · ${moduleSourceLabel(module)}`;

  const deleteBtn = document.getElementById('module-delete-btn');
  deleteBtn.disabled = moduleManagerMode === 'new' || module._source === 'bundled';
  deleteBtn.textContent = module._source === 'override' ? 'Reset override' : 'Delete';
  document.getElementById('module-duplicate-btn').disabled = moduleManagerMode === 'new';
  syncModuleTypeFields();
}

function syncNewModuleIdFromName() {
  const idInput = document.getElementById('module-id');
  if (moduleManagerMode !== 'new' || idInput.dataset.touched === 'true') return;
  idInput.value = slugifyClientId(document.getElementById('module-name').value);
}

function syncModuleTypeFields() {
  const type = document.getElementById('module-type').value;
  document.querySelectorAll('[data-module-fields]').forEach(section => {
    section.classList.toggle('hidden', section.dataset.moduleFields !== type);
  });
}

function parseModuleTabs(raw) {
  return String(raw || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [labelPart, ...urlParts] = line.split('|');
      const label = labelPart.trim();
      const url = urlParts.join('|').trim();
      return { label, url, default: index === 0 };
    });
}

function modulePayloadFromForm() {
  const type = document.getElementById('module-type').value;
  const payload = {
    id: document.getElementById('module-id').value.trim(),
    name: document.getElementById('module-name').value.trim(),
    type,
    category: document.getElementById('module-category').value.trim(),
    icon: document.getElementById('module-icon').value.trim(),
    order: document.getElementById('module-order').value,
    defaultSpan: {
      cols: document.getElementById('module-cols').value,
      rows: document.getElementById('module-rows').value,
    },
  };

  if (type === 'webview') {
    payload.url = document.getElementById('module-url').value.trim();
  } else if (type === 'webview-tabs') {
    payload.tabs = parseModuleTabs(document.getElementById('module-tabs').value);
  } else if (type === 'terminal') {
    const argsRaw = document.getElementById('module-args').value.trim();
    const args = argsRaw ? parseCommandLine(argsRaw) : [];
    if (args == null) throw new Error('Args have an unclosed quote');
    payload.command = document.getElementById('module-command').value.trim();
    payload.args = args;
    payload.cwd = document.getElementById('module-cwd').value.trim();
  }

  return payload;
}

async function refreshModules() {
  allModules = await window.appAPI.listModules();
  renderClosedList();
  renderModuleManagerList();
}

function replaceOpenTileModule(oldId, nextModule) {
  const existing = tiles.find(t => t.id === oldId);
  if (!existing || !nextModule) return;
  const snapshot = {
    span: existing.span,
    rect: existing.rect,
    muted: existing.muted,
  };
  removeTile(existing.id);
  addTile(nextModule, snapshot);
}

async function saveModuleFromForm(event) {
  event.preventDefault();
  setModuleFormError('');
  let payload;
  try {
    payload = modulePayloadFromForm();
  } catch (err) {
    setModuleFormError(err.message);
    return;
  }

  const previousId = moduleManagerMode === 'edit' ? moduleManagerSelectedId : null;
  const result = await window.appAPI.saveModule(payload, previousId);
  if (!result || !result.ok) {
    setModuleFormError(result && result.error ? result.error : 'Could not save module');
    return;
  }

  await refreshModules();
  moduleManagerSelectedId = result.module.id;
  moduleManagerMode = 'edit';
  const savedModule = moduleById(result.module.id) || result.module;
  fillModuleForm(savedModule);
  renderModuleManagerList();

  if (previousId && tiles.some(t => t.id === previousId)) {
    replaceOpenTileModule(previousId, savedModule);
  } else if (tiles.some(t => t.id === savedModule.id)) {
    replaceOpenTileModule(savedModule.id, savedModule);
  }

  saveCurrentState({ silent: true });
  showToast(`Saved module: ${savedModule.name}.`);
}

async function deleteSelectedModule() {
  if (moduleManagerMode !== 'edit' || !moduleManagerSelectedId) return;
  const module = moduleById(moduleManagerSelectedId);
  if (!module || module._source === 'bundled') return;
  const ok = await confirmAction({
    title: module._source === 'override' ? 'Reset module override?' : 'Delete module?',
    message: module._source === 'override'
      ? `${module.name} will return to its built-in configuration.`
      : `${module.name} will be removed from your custom modules.`,
    confirmLabel: module._source === 'override' ? 'Reset' : 'Delete',
  });
  if (!ok) return;

  const id = moduleManagerSelectedId;
  const result = await window.appAPI.deleteModule(id);
  if (!result || !result.ok) {
    setModuleFormError(result && result.error ? result.error : 'Could not delete module');
    return;
  }

  await refreshModules();
  const replacement = moduleById(id);
  if (replacement) {
    if (tiles.some(t => t.id === id)) replaceOpenTileModule(id, replacement);
    selectModuleForEdit(id);
    showToast(`Reset module: ${replacement.name}.`);
  } else {
    if (tiles.some(t => t.id === id)) removeTile(id);
    selectNewModule();
    showToast(`Deleted module: ${module.name}.`);
  }
  saveCurrentState({ silent: true });
}

function duplicateSelectedModule() {
  if (moduleManagerMode !== 'edit' || !moduleManagerSelectedId) return;
  const module = moduleById(moduleManagerSelectedId);
  if (!module) return;
  const copy = { ...module };
  delete copy._source;
  delete copy._userEditable;
  delete copy._fileName;
  copy.name = `${module.name} Copy`;
  copy.id = slugifyClientId(`${module.id}-copy`) || '';
  selectNewModule(copy);
  document.getElementById('module-id').dataset.touched = 'true';
}

function addTile(mod, {
  temporary = false,
  span: requestedSpan = null,
  rect: requestedRect = null,
  muted: requestedMuted = null,
} = {}) {
  if (tiles.some(t => t.id === mod.id)) return;
  const span = normalizeSpan(requestedSpan || sizes[mod.id] || defaultSpanFor(mod));
  const rect = normalizeRect(requestedRect || tileRects[mod.id], findOpenRect(span));
  const muted = requestedMuted == null ? mutes[mod.id] === true : !!requestedMuted;
  const record = {
    id: mod.id,
    module: mod,
    span,
    rect,
    muted,
    temporary,
    element: null,
    sizeBtn: null,
    muteBtn: null,
    focusBtn: null,
  };
  const el = buildTileElement(mod, record);
  record.element = el;
  applySpan(record, span);
  applyRect(record, rect);
  document.getElementById('grid').appendChild(el);
  tiles.push(record);
  updateCanvasExtent();
  saveOrder();
  updateWorkspaceStatus();
}

function removeTile(id) {
  const i = tiles.findIndex(t => t.id === id);
  if (i < 0) return;
  const t = tiles[i];
  if (t.module.type === 'terminal') {
    try { window.termAPI.kill(id); } catch {}
  }
  if (t.cleanup) { try { t.cleanup(); } catch {} }
  t.element.remove();
  tiles.splice(i, 1);
  if (focusedTileId === id) setFocusedTile(null);
  updateCanvasExtent();
  saveOrder();
  updateWorkspaceStatus();
}

function applySpan(record, span) {
  record.span = normalizeSpan(span);
  if (record.sizeBtn) record.sizeBtn.title = `Preset ${spanLabel(record.span)}`;
}

function setSpan(id, span, { persist = true } = {}) {
  const t = tiles.find(x => x.id === id);
  if (!t) return;
  applySpan(t, span);
  const size = rectFromSpan(t.span);
  setRect(id, { ...t.rect, w: size.w, h: size.h }, { persist });
  if (persist && !t.temporary) {
    sizes[id] = t.span;
    saveSizes();
  }
}

function applyRect(record, rect) {
  record.rect = normalizeRect(rect, record.rect);
  const el = record.element;
  if (editMode) {
    el.style.left = `${record.rect.x}px`;
    el.style.top = `${record.rect.y}px`;
    el.style.width = `${record.rect.w}px`;
    el.style.height = `${record.rect.h}px`;
  } else {
    const ref = currentEditRef();
    el.style.left = `${(record.rect.x / ref.w) * 100}%`;
    el.style.top = `${(record.rect.y / ref.h) * 100}%`;
    el.style.width = `${(record.rect.w / ref.w) * 100}%`;
    el.style.height = `${(record.rect.h / ref.h) * 100}%`;
  }
  if (record.sizeBtn) {
    record.sizeBtn.textContent = rectLabel(record.rect);
    record.sizeBtn.title = 'Click for preset size; drag edges/corners for exact resize';
  }
}

function currentEditRef() {
  if (layout.editRefSize) return layout.editRefSize;
  return snapshotRef();
}

function snapshotRef() {
  const bounds = gridRect();
  let maxR = bounds.width;
  let maxB = bounds.height;
  for (const t of tiles) {
    if (!t.rect) continue;
    maxR = Math.max(maxR, t.rect.x + t.rect.w + CANVAS_PAD);
    maxB = Math.max(maxB, t.rect.y + t.rect.h + CANVAS_PAD);
  }
  return { w: Math.ceil(maxR), h: Math.ceil(maxB) };
}

function clearCanvasExtent() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  grid.style.removeProperty('--canvas-w');
  grid.style.removeProperty('--canvas-h');
}

function fullRerender() {
  for (const t of tiles) applyRect(t, t.rect);
  if (editMode) {
    updateCanvasExtent();
  } else {
    clearCanvasExtent();
  }
}

function updateEditButton() {
  const btn = document.getElementById('edit-mode-btn');
  if (!btn) return;
  btn.classList.toggle('active', editMode);
  btn.textContent = editMode ? '● Editing' : '✎ Edit';
  btn.title = editMode
    ? 'Exit edit mode (saves layout, tiles resize with window)'
    : 'Enter edit mode (drag/resize tiles on a freeform canvas)';

  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.hidden = !editMode;
}

function setEditMode(on) {
  const was = editMode;
  editMode = !!on;
  document.body.classList.toggle('is-editing', editMode);
  saveEditMode();

  if (!editMode && was) {
    if (tiles.length > 0) {
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      tiles.forEach(t => {
        minX = Math.min(minX, t.rect.x);
        minY = Math.min(minY, t.rect.y);
      });

      // Shift to origin
      tiles.forEach(t => {
        t.rect.x -= minX;
        t.rect.y -= minY;
      });

      // Recalculate max
      tiles.forEach(t => {
        maxX = Math.max(maxX, t.rect.x + t.rect.w);
        maxY = Math.max(maxY, t.rect.y + t.rect.h);
      });

      layout.editRefSize = { w: maxX, h: maxY };
      saveLayout();
      saveRects();
    }
  }

  fullRerender();
  updateEditButton();
  updateWorkspaceStatus();

  if (!editMode && was) saveCurrentState();
}

function cancelEditMode() {
  if (!editMode) return;
  editMode = false;
  document.body.classList.remove('is-editing');
  saveEditMode();
  closeAddMenu();
  closeLayoutMenu();
  closeSaveLayoutMenu();
  restoreSlot(currentSlot);
  updateEditButton();
  flashSaveButton('Edit canceled');
}

function setRect(id, rect, { persist = true } = {}) {
  const t = tiles.find(x => x.id === id);
  if (!t) return;
  applyRect(t, snapRect(normalizeRect(rect, t.rect)));
  updateCanvasExtent();
  if (persist && !t.temporary) {
    tileRects[id] = t.rect;
    saveRects();
  }
}

function updateCanvasExtent() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  if (!editMode) {
    clearCanvasExtent();
    return;
  }
  const bounds = gridRect();
  let maxRight = bounds.width;
  let maxBottom = bounds.height;
  for (const t of tiles) {
    if (!t.rect) continue;
    maxRight = Math.max(maxRight, t.rect.x + t.rect.w + CANVAS_PAD);
    maxBottom = Math.max(maxBottom, t.rect.y + t.rect.h + CANVAS_PAD);
  }
  grid.style.setProperty('--canvas-w', `${Math.ceil(maxRight)}px`);
  grid.style.setProperty('--canvas-h', `${Math.ceil(maxBottom)}px`);
}

function setTileMuted(record, muted, { persist = true } = {}) {
  record.muted = !!muted;
  if (record.muteBtn) {
    record.muteBtn.textContent = record.muted ? '🔇' : '🔊';
    record.muteBtn.title = record.muted ? 'Unmute tile' : 'Mute tile';
    record.muteBtn.setAttribute('aria-label', record.muteBtn.title);
  }
  const wv = record.element && record.element.querySelector('webview');
  if (wv && typeof wv.setAudioMuted === 'function') {
    try { wv.setAudioMuted(record.muted); } catch {}
  }
  if (persist) {
    mutes[record.id] = record.muted;
    saveMutes();
  }
}

function gridMetrics() {
  const grid = document.getElementById('grid');
  const rect = grid.getBoundingClientRect();
  const gap = layout.gap;
  const colWidth = (rect.width - gap * (layout.columns - 1)) / layout.columns;
  return { grid, colWidth, rowHeight: layout.rowHeight, gap };
}

function startTileDrag(event, record) {
  if (!editMode) return;
  if (!record.element) return;
  if (event.button !== 0) return;
  if (event.target.closest('button, input, select, textarea, .tabs, .actions')) return;
  event.preventDefault();

  const startX = event.clientX;
  const startY = event.clientY;
  const startRect = { ...record.rect };
  let dragging = false;
  let frame = 0;
  let nextRect = startRect;

  bringToFront(record);

  const applyNext = () => {
    frame = 0;
    setRect(record.id, nextRect, { persist: false });
  };

  const onMove = e => {
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < 5 && Math.abs(e.clientY - startY) < 5) return;
      dragging = true;
      document.body.classList.add('is-dragging');
      record.element.classList.add('dragging');
    }
    nextRect = snapRect({
      ...startRect,
      x: Math.max(0, startRect.x + e.clientX - startX),
      y: Math.max(0, startRect.y + e.clientY - startY),
    });
    if (!frame) frame = requestAnimationFrame(applyNext);
  };

  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (frame) cancelAnimationFrame(frame);
    document.body.classList.remove('is-dragging');
    record.element.classList.remove('dragging');
    if (dragging) setRect(record.id, nextRect, { persist: true });
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, { once: true });
  window.addEventListener('pointercancel', onUp, { once: true });
}

function bringToFront(record) {
  const idx = tiles.indexOf(record);
  if (idx < 0 || idx === tiles.length - 1) return;
  tiles.splice(idx, 1);
  tiles.push(record);
  const grid = document.getElementById('grid');
  if (grid) grid.appendChild(record.element);
  saveOrder();
}

function startTileResize(event, record, direction = 'se') {
  if (!record.element) return;
  event.preventDefault();
  event.stopPropagation();

  const startX = event.clientX;
  const startY = event.clientY;
  const startRect = { ...record.rect };
  const bounds = gridRect();
  const ref = currentEditRef();
  const scaleX = ref.w / bounds.width;
  const scaleY = ref.h / bounds.height;
  let frame = 0;
  let nextRect = startRect;

  // Find adjacent tiles for tiling mode (non-edit)
  const adjacents = [];
  if (!editMode) {
    const TOLERANCE = 10; // internal pixels
    tiles.forEach(t => {
      if (t.id === record.id) return;
      const r = t.rect;
      
      if (direction === 'e' && Math.abs(r.x - (startRect.x + startRect.w)) < TOLERANCE) {
        adjacents.push({ tile: t, type: 'left-edge', startRect: { ...r } });
      } else if (direction === 'w' && Math.abs((r.x + r.w) - startRect.x) < TOLERANCE) {
        adjacents.push({ tile: t, type: 'right-edge', startRect: { ...r } });
      } else if (direction === 's' && Math.abs(r.y - (startRect.y + startRect.h)) < TOLERANCE) {
        adjacents.push({ tile: t, type: 'top-edge', startRect: { ...r } });
      } else if (direction === 'n' && Math.abs((r.y + r.h) - startRect.y) < TOLERANCE) {
        adjacents.push({ tile: t, type: 'bottom-edge', startRect: { ...r } });
      }
    });
  }

  bringToFront(record);
  document.body.classList.add('is-resizing');
  record.element.classList.add('resizing');

  const applyNext = () => {
    frame = 0;
    setRect(record.id, nextRect, { persist: false });

    // Adjust adjacents in tiling mode
    if (!editMode) {
      adjacents.forEach(adj => {
        const nr = { ...adj.startRect };
        if (adj.type === 'left-edge') {
          const dx = nextRect.x + nextRect.w - (startRect.x + startRect.w);
          nr.x = adj.startRect.x + dx;
          nr.w = Math.max(MIN_TILE_W, adj.startRect.w - dx);
        } else if (adj.type === 'right-edge') {
          const dx = nextRect.x - startRect.x;
          nr.w = Math.max(MIN_TILE_W, adj.startRect.w + dx);
        } else if (adj.type === 'top-edge') {
          const dy = nextRect.y + nextRect.h - (startRect.y + startRect.h);
          nr.y = adj.startRect.y + dy;
          nr.h = Math.max(MIN_TILE_H, adj.startRect.h - dy);
        } else if (adj.type === 'bottom-edge') {
          const dy = nextRect.y - startRect.y;
          nr.h = Math.max(MIN_TILE_H, adj.startRect.h + dy);
        }
        setRect(adj.tile.id, nr, { persist: false });
      });
    }
  };

  const move = e => {
    let dx = (e.clientX - startX) * scaleX;
    let dy = (e.clientY - startY) * scaleY;

    // Pre-clamp dx/dy to prevent overlapping or over-shrinking of any involved tile
    if (!editMode) {
      if (direction.includes('e')) {
        const maxGrowth = Math.min(...[Infinity, ...adjacents.filter(a => a.type === 'left-edge').map(a => a.startRect.w - MIN_TILE_W)]);
        dx = Math.max(MIN_TILE_W - startRect.w, Math.min(dx, maxGrowth));
      }
      if (direction.includes('w')) {
        const maxShrink = startRect.w - MIN_TILE_W;
        const maxGrowth = Math.min(...[Infinity, ...adjacents.filter(a => a.type === 'right-edge').map(a => a.startRect.w - MIN_TILE_W)]);
        dx = Math.max(-maxGrowth, Math.min(dx, maxShrink));
      }
      if (direction.includes('s')) {
        const maxGrowthH = Math.min(...[Infinity, ...adjacents.filter(a => a.type === 'top-edge').map(a => a.startRect.h - MIN_TILE_H)]);
        dy = Math.max(MIN_TILE_H - startRect.h, Math.min(dy, maxGrowthH));
      }
      if (direction.includes('n')) {
        const maxShrinkH = startRect.h - MIN_TILE_H;
        const maxGrowthH = Math.min(...[Infinity, ...adjacents.filter(a => a.type === 'bottom-edge').map(a => a.startRect.h - MIN_TILE_H)]);
        dy = Math.max(-maxGrowthH, Math.min(dy, maxShrinkH));
      }
    }

    let x = startRect.x;
    let y = startRect.y;
    let w = startRect.w;
    let h = startRect.h;

    if (direction.includes('e')) w = startRect.w + dx;
    if (direction.includes('s')) h = startRect.h + dy;
    if (direction.includes('w')) {
      x = startRect.x + dx;
      w = startRect.w - dx;
    }
    if (direction.includes('n')) {
      y = startRect.y + dy;
      h = startRect.h - dy;
    }

    // Secondary safety clamp
    if (w < MIN_TILE_W) {
      if (direction.includes('w')) x -= MIN_TILE_W - w;
      w = MIN_TILE_W;
    }
    if (h < MIN_TILE_H) {
      if (direction.includes('n')) y -= MIN_TILE_H - h;
      h = MIN_TILE_H;
    }

    nextRect = snapRect(normalizeRect({ x: Math.max(0, x), y: Math.max(0, y), w, h }, startRect));
    if (!frame) frame = requestAnimationFrame(applyNext);
  };

  const stop = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
    if (frame) cancelAnimationFrame(frame);
    document.body.classList.remove('is-resizing');
    record.element.classList.remove('resizing');
    setRect(record.id, nextRect, { persist: true });

    if (!editMode) {
      adjacents.forEach(adj => {
        const t = tiles.find(x => x.id === adj.tile.id);
        if (t) setRect(t.id, t.rect, { persist: true });
      });
      saveCurrentState();
    }
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop, { once: true });
  window.addEventListener('pointercancel', stop, { once: true });
}

function cycleSize(id) {
  const t = tiles.find(x => x.id === id);
  if (!t) return;
  const current = SIZE_CYCLE.findIndex(s => s.cols === t.span.cols && s.rows === t.span.rows);
  const next = SIZE_CYCLE[(Math.max(current, 0) + 1) % SIZE_CYCLE.length];
  setSpan(id, next);
}

function resetSizes() {
  sizes = {};
  tileRects = {};
  layout.editRefSize = null;
  saveSizes();
  saveRects();
  saveLayout();

  const placed = [];
  for (const t of tiles) {
    const span = defaultSpanFor(t.module);
    applySpan(t, span);
    const rect = findOpenRect(span, placed);
    applyRect(t, rect);
    if (!t.temporary) {
      sizes[t.id] = t.span;
      tileRects[t.id] = t.rect;
    }
    placed.push(t);
  }
  fullRerender();
  saveSizes();
  saveRects();
  saveCurrentState({ silent: true });
  flashSaveButton('Reset saved');
  updateCanvasExtent();
}

function tileCurrentUrl(record) {
  if (!record || !record.element) return null;
  const wv = record.element.querySelector('webview');
  if (!wv) return null;
  try {
    return typeof wv.getURL === 'function' ? wv.getURL() : wv.src;
  } catch {
    return wv.src || null;
  }
}

function moduleForSnapshot(record) {
  if (!record.temporary) return undefined;
  const module = { ...record.module };
  delete module.startUrl;
  return module;
}

function saveCurrentState({ silent = false, slot = currentSlot, name = null } = {}) {
  const nextSizes = {};
  const nextRects = {};
  const nextMutes = { ...mutes };
  for (const t of tiles) {
    if (!t.temporary) nextSizes[t.id] = t.span;
    if (!t.temporary) nextRects[t.id] = t.rect;
    nextMutes[t.id] = !!t.muted;
  }

  sizes = nextSizes;
  tileRects = nextRects;
  mutes = nextMutes;
  saveSizes();
  saveRects();
  saveMutes();
  saveLayout();

  const snapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    layout,
    sizes,
    rects: tileRects,
    mutes,
    tiles: tiles.map(t => ({
      id: t.id,
      temporary: !!t.temporary,
      span: t.span,
      rect: t.rect,
      muted: !!t.muted,
      currentUrl: tileCurrentUrl(t),
      module: moduleForSnapshot(t),
    })),
  };
  const slotId = String(slot || currentSlot);
  localStorage.setItem(`${SAVED_STATE_KEY_BASE}:${slotId}`, JSON.stringify(snapshot));

  const meta = ensureLayoutSlot(slotId, name);
  if (meta) {
    meta.savedAt = snapshot.savedAt;
    if (name != null) meta.name = String(name).trim() || `Layout ${slotId}`;
    saveLayoutSlots();
    renderLayoutSlots();
  }

  if (silent) return;

  flashSaveButton(`Saved: ${layoutSlotName(slotId)}`);
}

function flashSaveButton(label = 'Saved') {
  const btn = document.getElementById('save-layout-btn');
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = label;
  btn.classList.add('saved');
  window.clearTimeout(btn._savedTimer);
  btn._savedTimer = window.setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('saved');
  }, 1200);
}

function buildTileElement(mod, record) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.id = mod.id;

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.addEventListener('pointerdown', e => startTileDrag(e, record));

  const titleWrap = document.createElement('span');
  titleWrap.className = 'tile-title';
  const icon = document.createElement('span');
  icon.className = 'tile-icon';
  icon.textContent = mod.icon || '';
  icon.hidden = !mod.icon;
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = modDisplayName(mod, record.temporary);
  name.title = mod.name || mod.id;
  titleWrap.append(icon, name);
  bar.appendChild(titleWrap);
  record.iconEl = icon;
  record.nameEl = name;

  let tabs = null;
  const startUrl = mod.startUrl || null;
  if (mod.type === 'webview-tabs' && Array.isArray(mod.tabs)) {
    const defaultTab = mod.tabs.find(t => t.default) || mod.tabs[0];
    const activeUrl = startUrl || (defaultTab && defaultTab.url);
    tabs = document.createElement('span');
    tabs.className = 'tabs';
    for (const t of mod.tabs) {
      const b = document.createElement('button');
      b.textContent = t.label;
      b.dataset.url = t.url;
      if (t.url === activeUrl) b.classList.add('active');
      tabs.appendChild(b);
    }
    bar.appendChild(tabs);
  }

  const actions = document.createElement('span');
  actions.className = 'actions';

  const focusBtn = document.createElement('button');
  focusBtn.className = 'focus-btn';
  focusBtn.textContent = '⛶';
  focusBtn.title = 'Focus this tile';
  focusBtn.setAttribute('aria-label', focusBtn.title);
  focusBtn.addEventListener('click', () => setFocusedTile(focusedTileId === mod.id ? null : mod.id));
  actions.appendChild(focusBtn);
  record.focusBtn = focusBtn;

  const sizeBtn = document.createElement('button');
  sizeBtn.className = 'size-btn';
  sizeBtn.textContent = rectLabel(record.rect);
  sizeBtn.title = 'Click for preset size; drag edges/corners for exact resize';
  sizeBtn.addEventListener('click', () => cycleSize(mod.id));
  actions.appendChild(sizeBtn);
  record.sizeBtn = sizeBtn;

  const muteBtn = document.createElement('button');
  muteBtn.className = 'mute-btn';
  muteBtn.hidden = mod.type === 'terminal';
  muteBtn.addEventListener('click', () => setTileMuted(record, !record.muted));
  actions.appendChild(muteBtn);
  record.muteBtn = muteBtn;
  setTileMuted(record, record.muted, { persist: false });

  const reloadBtn = document.createElement('button');
  reloadBtn.textContent = '↻';
  reloadBtn.title = mod.type === 'terminal' ? 'Restart process' : 'Reload';
  actions.appendChild(reloadBtn);

  const backBtn = document.createElement('button');
  backBtn.textContent = '←';
  backBtn.title = 'Back';
  backBtn.hidden = mod.type === 'terminal';
  actions.appendChild(backBtn);

  const forwardBtn = document.createElement('button');
  forwardBtn.textContent = '→';
  forwardBtn.title = 'Forward';
  forwardBtn.hidden = mod.type === 'terminal';
  actions.appendChild(forwardBtn);

  const homeBtn = document.createElement('button');
  homeBtn.textContent = '⌂';
  homeBtn.title = 'Go to module home';
  homeBtn.hidden = mod.type === 'terminal';
  actions.appendChild(homeBtn);

  const openExternalBtn = document.createElement('button');
  openExternalBtn.textContent = '↗';
  openExternalBtn.title = 'Open in browser';
  if (mod.type === 'terminal') openExternalBtn.hidden = true;
  actions.appendChild(openExternalBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  closeBtn.title = record.temporary
    ? 'Close this temporary tile'
    : 'Close; use Save layout to keep it closed next launch';
  closeBtn.addEventListener('click', () => removeTile(mod.id));
  actions.appendChild(closeBtn);

  bar.appendChild(actions);
  tile.appendChild(bar);

  if (mod.type === 'webview' || mod.type === 'webview-tabs') {
    const wv = document.createElement('webview');
    let url = startUrl || (mod.type === 'webview-tabs'
      ? (mod.tabs.find(t => t.default) || mod.tabs[0]).url
      : mod.url);
    let homeUrl = url;
    wv.src = url;
    wv.setAttribute('partition', 'persist:main');
    wv.setAttribute('allowpopups', '');
    wv.setAttribute('webpreferences', 'backgroundThrottling=no, spellcheck=no');
    if (webviewPreloadUrl) wv.setAttribute('preload', webviewPreloadUrl);
    tile.appendChild(wv);
    wv.addEventListener('dom-ready', () => setTileMuted(record, record.muted, { persist: false }));
    reloadBtn.addEventListener('click', () => wv.reload());
    backBtn.addEventListener('click', () => {
      try { if (typeof wv.canGoBack !== 'function' || wv.canGoBack()) wv.goBack(); } catch {}
    });
    forwardBtn.addEventListener('click', () => {
      try { if (typeof wv.canGoForward !== 'function' || wv.canGoForward()) wv.goForward(); } catch {}
    });
    homeBtn.addEventListener('click', () => {
      if (homeUrl) wv.src = homeUrl;
    });
    openExternalBtn.addEventListener('click', async () => {
      const currentUrl = typeof wv.getURL === 'function' ? wv.getURL() : wv.src;
      const result = await window.appAPI.openExternal(currentUrl || url);
      if (!result || !result.ok) showToast(`Could not open URL: ${result && result.error}`, 'error');
    });
    if (tabs) {
      tabs.addEventListener('click', e => {
        const b = e.target.closest('button[data-url]');
        if (!b) return;
        url = b.dataset.url;
        homeUrl = url;
        wv.src = url;
        tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
    }
  } else if (mod.type === 'terminal') {
    const container = document.createElement('div');
    container.className = 'term-container';
    tile.appendChild(container);
    record.cleanup = mountTerminal(mod, container, reloadBtn);
  } else {
    const err = document.createElement('div');
    err.className = 'err';
    err.textContent = `Unknown module type: ${mod.type}`;
    tile.appendChild(err);
  }

  for (const dir of ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']) {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = `resize-handle resize-${dir}`;
    resizeHandle.title = 'Drag to resize';
    resizeHandle.addEventListener('pointerdown', e => startTileResize(e, record, dir));
    tile.appendChild(resizeHandle);
  }

  return tile;
}

function mountTerminal(mod, container, restartBtn) {
  const TerminalCls = window.Terminal;
  const FitAddonCls =
    (window.FitAddon && window.FitAddon.FitAddon) ||
    window.FitAddon;

  const term = new TerminalCls({
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 12,
    theme: { background: '#000', foreground: '#e5e5e5' },
    cursorBlink: true,
    convertEol: true,
    allowProposedApi: true,
  });

  const fit = new FitAddonCls();
  term.loadAddon(fit);
  term.open(container);

  const safeFit = () => { try { fit.fit(); } catch {} };
  requestAnimationFrame(safeFit);

  let unsubData = null;
  let unsubExit = null;

  async function start() {
    if (unsubData) unsubData();
    if (unsubExit) unsubExit();
    unsubData = null;
    unsubExit = null;

    safeFit();
    const label = mod.name || mod.command;
    const { cols, rows } = term;

    unsubData = window.termAPI.onData(mod.id, data => term.write(data));
    unsubExit = window.termAPI.onExit(mod.id, code => {
      term.write(`\r\n\x1b[33m[${label} exited (code ${code}). press ↻ to restart]\x1b[0m\r\n`);
      if (unsubData) unsubData();
      if (unsubExit) unsubExit();
      unsubData = null;
      unsubExit = null;
    });

    let res;
    try {
      res = await window.termAPI.spawn(mod.id, {
        command: mod.command,
        args: mod.args,
        cwd: mod.cwd,
        cols,
        rows,
      });
    } catch (err) {
      res = { ok: false, error: err.message };
    }

    if (!res || !res.ok) {
      if (unsubData) unsubData();
      if (unsubExit) unsubExit();
      unsubData = null;
      unsubExit = null;
      term.write(`\r\n\x1b[31m[failed to start ${label}: ${res && res.error}]\x1b[0m\r\n`);
    }
  }

  term.onData(d => window.termAPI.write(mod.id, d));
  term.onResize(({ cols, rows }) => window.termAPI.resize(mod.id, cols, rows));

  restartBtn.addEventListener('click', () => {
    if (unsubData) unsubData();
    if (unsubExit) unsubExit();
    unsubData = null;
    unsubExit = null;
    try { window.termAPI.kill(mod.id); } catch {}
    term.reset();
    start();
  });

  start();

  const ro = new ResizeObserver(() => safeFit());
  ro.observe(container);

  return () => {
    if (unsubData) unsubData();
    if (unsubExit) unsubExit();
    try { ro.disconnect(); } catch {}
    try { term.dispose(); } catch {}
  };
}
