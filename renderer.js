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
const LAYOUT_KEY = 'brainrot:layout:v3';
const GRID_LAYOUTS_KEY = 'brainrot:grid-layouts:v2';
const MUTES_KEY = 'brainrot:mutes:v1';
const SAVED_STATE_KEY_BASE = 'brainrot:saved-state:v1';
const STARTUP_STATE_KEY = 'brainrot:startup-state:v1';
const EDIT_MODE_KEY = 'brainrot:edit-mode:v1';
const ACTIVE_SLOT_KEY = 'brainrot:active-slot';
const LAYOUT_SLOT_META_KEY = 'brainrot:layout-slot-meta:v1';
const DEFAULT_LAYOUT_SLOT_COUNT = 4;
const MAX_LAYOUT_SLOTS = 8;
const CANVAS_PAD = 8;
const GRID_RESOLUTION = 2;
const LAYOUT_PRESETS = {
  compact: { columns: 12, rowHeight: 64, gap: 6, locked: true },
  default: { columns: 12, rowHeight: 76, gap: 8, locked: true },
  wide: { columns: 14, rowHeight: 76, gap: 8, locked: true },
  focus: { columns: 10, rowHeight: 84, gap: 8, locked: true },
};
const CHAOS_MODE_KEY = 'brainrot:chaos-mode:v1';
const CHAOS_INTERVAL_KEY = 'brainrot:chaos-interval:v1';
const ROT_PRESET_OVERRIDES_KEY = 'brainrot:rot-preset-overrides:v2';
const DEFAULT_CHAOS_INTERVAL = 30;
const STARTUP_PRESET_KEY = 'default-brainrot';
const ROT_PRESETS = {
  'default-brainrot': {
    label: 'Default Brainrot',
    layout: 'wide',
    gridResolution: 2,
    layoutSettings: { columns: 8, rowHeight: 180, gap: 3, locked: true },
    modules: ['tiktok', 'youtube-shorts', 'instagram', 'x', 'twitch', 'codex', 'news'],
    grids: {
      tiktok: { col: 7, row: 0, colSpan: 3, rowSpan: 7 },
      'youtube-shorts': { col: 4, row: 0, colSpan: 3, rowSpan: 7 },
      instagram: { col: 10, row: 0, colSpan: 3, rowSpan: 7 },
      x: { col: 0, row: 0, colSpan: 4, rowSpan: 19 },
      twitch: { col: 4, row: 7, colSpan: 6, rowSpan: 12 },
      codex: { col: 13, row: 0, colSpan: 3, rowSpan: 7 },
      news: { col: 10, row: 7, colSpan: 6, rowSpan: 12 },
    },
  },
  'locked-in': {
    label: 'Locked In',
    layout: 'wide',
    gridResolution: 2,
    layoutSettings: { columns: 14, rowHeight: 76, gap: 8, locked: true },
    modules: ['codex', 'claude-code'],
    grids: {
      codex: { col: 9, row: 0, colSpan: 9, rowSpan: 19 },
      'claude-code': { col: 0, row: 0, colSpan: 9, rowSpan: 19 },
    },
  },
  vibecodemaxxer: {
    label: 'VibeCodemaxxer',
    layout: 'wide',
    gridResolution: 2,
    layoutSettings: { columns: 14, rowHeight: 76, gap: 8, locked: true },
    modules: ['tiktok', 'instagram', 'codex', 'youtube-shorts', 'claude-code', 'x'],
    grids: {
      tiktok: { col: 16, row: 0, colSpan: 4, rowSpan: 13 },
      instagram: { col: 20, row: 0, colSpan: 4, rowSpan: 13 },
      codex: { col: 6, row: 0, colSpan: 10, rowSpan: 13 },
      'youtube-shorts': { col: 20, row: 13, colSpan: 4, rowSpan: 17 },
      'claude-code': { col: 6, row: 13, colSpan: 7, rowSpan: 17 },
      x: { col: 0, row: 0, colSpan: 6, rowSpan: 30 },
    },
  },
  'news-fiend': {
    label: 'News Fiend',
    layout: 'wide',
    gridResolution: 2,
    layoutSettings: { columns: 14, rowHeight: 76, gap: 8, locked: true },
    modules: ['news-bbc', 'news-reuters', 'news-ap', 'tradingview', 'x'],
    grids: {
      'news-bbc': { col: 0, row: 0, colSpan: 10, rowSpan: 13 },
      'news-reuters': { col: 10, row: 0, colSpan: 10, rowSpan: 13 },
      'news-ap': { col: 0, row: 13, colSpan: 10, rowSpan: 14 },
      tradingview: { col: 10, row: 13, colSpan: 10, rowSpan: 14 },
      x: { col: 20, row: 0, colSpan: 8, rowSpan: 27 },
    },
  },
  'performative-trader': {
    label: 'Performative Trader',
    layout: 'wide',
    gridResolution: 2,
    layoutSettings: { columns: 14, rowHeight: 76, gap: 8, locked: true },
    modules: ['yahoo-finance', 'tradingview', 'bloomberg-markets', 'marketwatch'],
    grids: {
      'yahoo-finance': { col: 0, row: 0, colSpan: 14, rowSpan: 12 },
      tradingview: { col: 14, row: 0, colSpan: 14, rowSpan: 12 },
      'bloomberg-markets': { col: 0, row: 12, colSpan: 14, rowSpan: 16 },
      marketwatch: { col: 14, row: 12, colSpan: 14, rowSpan: 16 },
    },
  },
};
const DEFAULT_SPANS = {
  x: { cols: 1, rows: 2 },
  instagram: { cols: 2, rows: 2 },
  'youtube-shorts': { cols: 2, rows: 2 },
  tiktok: { cols: 1, rows: 2 },
  twitch: { cols: 2, rows: 2 },
  news: { cols: 2, rows: 2 },
  'news-bbc': { cols: 2, rows: 2 },
  'news-reuters': { cols: 2, rows: 2 },
  'news-ap': { cols: 2, rows: 2 },
  'news-hn': { cols: 2, rows: 2 },
  gemini: { cols: 2, rows: 2 },
  'yahoo-finance': { cols: 2, rows: 2 },
  tradingview: { cols: 2, rows: 2 },
  'bloomberg-markets': { cols: 2, rows: 2 },
  marketwatch: { cols: 2, rows: 2 },
  'claude-code': { cols: 2, rows: 2 },
  codex: { cols: 2, rows: 2 },
};

let allModules = [];
const tiles = [];
let sizes = loadSizes();
let tileRects = loadRects();
let gridLayouts = loadGridLayouts();
let layout = loadLayout();
let mutes = loadMutes();
let webviewPreloadUrl = null;
let editMode = loadEditMode();
let currentSlot = localStorage.getItem(ACTIVE_SLOT_KEY) || '1';
let layoutSlots = loadLayoutSlots();
let focusedTileId = null;
let commandItems = [];
let commandActiveIndex = 0;
let moduleManagerSelectedId = null;
let moduleManagerMode = 'new';
const sessionStartedAt = Date.now();
let chaosMode = localStorage.getItem(CHAOS_MODE_KEY) === 'true';
let chaosIntervalSeconds = clampInt(localStorage.getItem(CHAOS_INTERVAL_KEY), 10, 180, DEFAULT_CHAOS_INTERVAL);
let chaosTimer = null;
let statusTimer = null;
let transientPresetActive = false;
let startupDefaultActive = false;
let rotPresetOverrides = loadRotPresetOverrides();
let selectedRotPresetKey = Object.keys(ROT_PRESETS)[0];
let layoutResizeFrame = 0;
let activeLayoutMenuTab = 'saved';
let appReady = false;

(async function init() {
  [allModules, webviewPreloadUrl] = await Promise.all([
    window.appAPI.listModules(),
    window.appAPI.webviewPreloadUrl(),
  ]);
  const startupState = loadStartupState();
  const savedState = startupState || loadSavedState(currentSlot);
  let startupTiles;
  if (savedState) {
    startupTiles = tilesFromSavedState(savedState);
    if (savedState.layout) layout = normalizeLayout(savedState.layout);
    if (savedState.sizes) sizes = savedState.sizes;
    if (savedState.rects) tileRects = savedState.rects;
    if (savedState.gridLayouts) gridLayouts = normalizeSavedGridMap(savedState.gridLayouts, sourceGridResolution(savedState));
    if (savedState.mutes) mutes = savedState.mutes;
    startupDefaultActive = !!startupState;
  } else {
    startupTiles = tilesFromStartupPreset();
    selectedRotPresetKey = STARTUP_PRESET_KEY;
    transientPresetActive = true;
    sizes = {};
    tileRects = {};
    gridLayouts = {};
  }
  document.body.classList.toggle('is-editing', editMode);
  applyLayout();
  wireToolbar();
  for (const tile of startupTiles) {
    addTile(tile.module, {
      temporary: tile.temporary,
      span: tile.span,
      grid: tile.grid,
      rect: tile.rect,
      muted: tile.muted,
    });
  }
  fullRerender();
  updateEditButton();
  renderLayoutSlots();
  updateWorkspaceStatus();
  renderRotPresetControls();
  syncChaosControls();
  startStatusTimer();
  setChaosMode(chaosMode, { silent: true });
  appReady = true;
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

function loadGridLayouts() {
  return loadJson(GRID_LAYOUTS_KEY, {});
}

function saveGridLayouts() {
  localStorage.setItem(GRID_LAYOUTS_KEY, JSON.stringify(gridLayouts));
}

function loadMutes() {
  return loadJson(MUTES_KEY, {});
}

function saveMutes() {
  localStorage.setItem(MUTES_KEY, JSON.stringify(mutes));
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

function loadStartupState() {
  const saved = loadJson(STARTUP_STATE_KEY, null);
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
    columns: clampInt(value.columns, 8, 24, base.columns),
    rowHeight: clampInt(value.rowHeight, 48, 180, base.rowHeight),
    gap: clampInt(value.gap, 0, 16, base.gap),
    locked: value.locked !== false,
  };
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

function savedGridResolution(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function sourceGridResolution(source) {
  return savedGridResolution(source && (source.gridResolution || source.gridDetail || source.gridScale));
}

function clampSpan(span) {
  return {
    cols: clampInt(span && span.cols, 1, layout.columns || 12, 1),
    rows: clampInt(span && span.rows, 1, 12, 1),
  };
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

function gridRect() {
  const grid = document.getElementById('grid');
  if (!grid) return { width: window.innerWidth || 1600, height: window.innerHeight || 900 };
  return {
    width: Math.max(grid.clientWidth, 900),
    height: Math.max(grid.clientHeight, 620),
  };
}

function layoutEngine() {
  return window.BrainrotLayoutEngine;
}

function layoutConfig() {
  return layoutEngine().normalizeConfig({
    columns: layout.columns * GRID_RESOLUTION,
    rowHeight: Math.max(24, Math.round(layout.rowHeight / GRID_RESOLUTION)),
    gap: Math.max(0, Math.round(layout.gap / GRID_RESOLUTION)),
    pad: CANVAS_PAD,
  });
}

function layoutViewportWidth() {
  return gridRect().width;
}

function gridUnitSize() {
  const config = layoutConfig();
  return {
    col: layoutEngine().cellWidth(config, layoutViewportWidth()) + config.gap,
    row: config.rowHeight + config.gap,
  };
}

function gridItems({ includeTemporary = true } = {}) {
  return tiles
    .filter(t => includeTemporary || !t.temporary)
    .map(t => t.grid ? { ...t.grid, id: t.id } : null)
    .filter(Boolean);
}

function gridFromSpan(span) {
  const normalized = normalizeSpan(span || LEGACY_SIZES.S);
  return {
    colSpan: normalized.cols * GRID_RESOLUTION,
    rowSpan: Math.max(1, normalized.rows * 3 * GRID_RESOLUTION),
  };
}

function spanFromGrid(grid) {
  const item = layoutEngine().normalizeItem(grid || {}, layoutConfig());
  return clampSpan({
    cols: Math.max(1, Math.round(item.colSpan / GRID_RESOLUTION)),
    rows: Math.max(1, Math.round(item.rowSpan / (3 * GRID_RESOLUTION))),
  });
}

function normalizeGridItem(value, fallback = null) {
  const base = fallback || { col: 0, row: 0, colSpan: 2 * GRID_RESOLUTION, rowSpan: 3 * GRID_RESOLUTION };
  return layoutEngine().normalizeItem({ ...base, ...(value || {}) }, layoutConfig());
}

function scaleGridToCurrent(grid, fromResolution = GRID_RESOLUTION) {
  if (!grid || typeof grid !== 'object') return null;
  const sourceResolution = savedGridResolution(fromResolution);
  const ratio = GRID_RESOLUTION / sourceResolution;
  return {
    id: grid.id == null ? null : String(grid.id),
    col: Math.round((Number(grid.col) || 0) * ratio),
    row: Math.round((Number(grid.row) || 0) * ratio),
    colSpan: Math.max(1, Math.round((Number(grid.colSpan) || 1) * ratio)),
    rowSpan: Math.max(1, Math.round((Number(grid.rowSpan) || 1) * ratio)),
  };
}

function normalizeSavedGridMap(map, fromResolution = GRID_RESOLUTION) {
  const next = {};
  if (!map || typeof map !== 'object') return next;
  for (const [id, grid] of Object.entries(map)) {
    const scaled = scaleGridToCurrent({ ...grid, id }, fromResolution);
    if (scaled) next[id] = cleanGridItem(scaled);
  }
  return next;
}

function cleanGridItem(grid) {
  const item = normalizeGridItem(grid);
  return {
    col: item.col,
    row: item.row,
    colSpan: item.colSpan,
    rowSpan: item.rowSpan,
  };
}

function gridLabel(grid) {
  return spanLabel(spanFromGrid(grid));
}

function rectToGrid(rect, id = null) {
  const item = layoutEngine().rectToGrid(rect, layoutConfig(), layoutViewportWidth());
  if (id != null) item.id = id;
  return item;
}

function tilesFromStartupPreset() {
  const preset = rotPreset(STARTUP_PRESET_KEY);
  if (!preset) return allModules.map(module => ({ module, temporary: false }));

  layout = normalizeLayout(preset.layoutSettings || LAYOUT_PRESETS[preset.layout] || LAYOUT_PRESETS.wide);
  const grids = normalizeGridMap(preset.grids, preset.modules, preset.gridResolution);
  const startupTiles = preset.modules
    .map(id => {
      const module = moduleById(id);
      return module ? { module, temporary: false, grid: grids[id] } : null;
    })
    .filter(Boolean);

  return startupTiles.length
    ? startupTiles
    : allModules.map(module => ({ module, temporary: false }));
}

function tilesFromSavedState(savedState) {
  if (!savedState) {
    return tilesFromStartupPreset();
  }

  const resolution = sourceGridResolution(savedState);
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
    const savedGrid = savedTile.grid || (savedState.gridLayouts && savedState.gridLayouts[savedTile.id]);
    restored.push({
      module,
      temporary: !coreModule || !!savedTile.temporary,
      span: savedTile.span,
      grid: scaleGridToCurrent(savedGrid, resolution),
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
  document.getElementById('rot-preset-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-rot-preset]');
    if (!btn) return;
    selectedRotPresetKey = btn.dataset.rotPreset;
    syncRotPresetEditor();
    applyRotPreset(selectedRotPresetKey);
  });
  document.getElementById('rot-edit-select').addEventListener('change', e => {
    selectedRotPresetKey = e.target.value;
    syncRotPresetEditor();
  });
  document.getElementById('rot-load-btn').addEventListener('click', () => applyRotPreset(selectedRotPresetKey));
  document.getElementById('rot-save-current-btn').addEventListener('click', saveCurrentWorkspaceAsRotPreset);
  document.getElementById('rot-reset-preset-btn').addEventListener('click', resetSelectedRotPreset);
  document.getElementById('chaos-enabled').addEventListener('change', e => setChaosMode(e.target.checked));
  document.getElementById('chaos-interval').addEventListener('change', e => {
    chaosIntervalSeconds = clampInt(e.target.value, 10, 180, chaosIntervalSeconds);
    localStorage.setItem(CHAOS_INTERVAL_KEY, String(chaosIntervalSeconds));
    syncChaosControls();
    if (chaosMode) setChaosMode(true, { silent: true });
  });
  window.addEventListener('keydown', handleGlobalKeydown);
  document.getElementById('layout-menu').addEventListener('click', e => {
    const tab = e.target.closest('button[data-layout-menu-tab]');
    if (tab) setLayoutMenuTab(tab.dataset.layoutMenuTab);
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
  document.getElementById('startup-default-btn').addEventListener('click', () => saveStartupDefault());
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
    layout.columns = clampInt(columnsInput.value, 8, 24, layout.columns);
    applyLayout({ persist: true, normalizeTiles: true });
  });
  rowHeightInput.addEventListener('change', () => {
    layout.rowHeight = clampInt(rowHeightInput.value, 48, 180, layout.rowHeight);
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
    const layoutMenu = document.getElementById('layout-menu');
    if (!layoutMenu.classList.contains('hidden') && !layoutMenu.contains(e.target) && e.target.id !== 'layout-btn') {
      closeLayoutMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (layoutResizeFrame) cancelAnimationFrame(layoutResizeFrame);
    layoutResizeFrame = requestAnimationFrame(() => {
      layoutResizeFrame = 0;
      fullRerender();
    });
  });

  window.addEventListener('beforeunload', () => {
    if (appReady) saveStartupDefault({ silent: true });
  });
}

function renderLayoutSlots() {
  const listRoot = document.getElementById('layout-slot-list');
  if (listRoot) listRoot.innerHTML = '';

  for (const slot of layoutSlots) {
    if (listRoot) {
      const item = document.createElement('button');
      item.dataset.layoutSlot = slot.id;
      item.className = 'slot-list-btn';
      item.textContent = slot.name;
      item.title = slot.savedAt ? `Saved ${new Date(slot.savedAt).toLocaleString()}` : 'Empty layout slot';
      item.classList.toggle('active', !transientPresetActive && !startupDefaultActive && slot.id === currentSlot);
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
  closeLayoutMenu();
}

function saveLayoutToSlot(slotId, name) {
  const slot = ensureLayoutSlot(slotId, name);
  if (!slot) {
    showToast(`You can save up to ${MAX_LAYOUT_SLOTS} layout slots.`, 'error');
    return;
  }

  const savingActiveSlot = slot.id === currentSlot;
  slot.name = String(name || slot.name).trim() || `Layout ${slot.id}`;
  saveLayoutSlots();
  saveCurrentState({ silent: true, slot: slot.id, name: slot.name });
  renderLayoutSlots();
  flashSaveButton(savingActiveSlot ? `Saved: ${slot.name}` : `Copied to: ${slot.name}`);
  if (!savingActiveSlot) {
    showToast(`Copied current layout to ${slot.name}. Active layout stayed ${layoutSlotName(currentSlot)}.`);
  }
}

async function switchSlot(slotId) {
  const slot = ensureLayoutSlot(slotId);
  if (!slot) return;
  if (slotId === currentSlot && !transientPresetActive && !startupDefaultActive) return;

  if (transientPresetActive || startupDefaultActive) {
    showToast(transientPresetActive ? 'Preset preview discarded. Use Save to keep a preset.' : 'Startup default discarded.');
  } else {
    saveCurrentState({ silent: true });
  }
  restoreSlot(slot.id);
}

function restoreSlot(slotId) {
  const slot = ensureLayoutSlot(slotId);
  if (!slot) return;
  transientPresetActive = false;
  startupDefaultActive = false;

  while (tiles.length > 0) {
    removeTile(tiles[0].id);
  }

  currentSlot = slot.id;
  localStorage.setItem(ACTIVE_SLOT_KEY, currentSlot);
  renderLayoutSlots();

  const savedState = loadSavedState(currentSlot);
  let startupTiles = tilesFromSavedState(savedState);

  if (savedState && savedState.layout) layout = normalizeLayout(savedState.layout);

  if (savedState && savedState.sizes) sizes = savedState.sizes;
  else sizes = {};

  if (savedState && savedState.rects) tileRects = savedState.rects;
  else tileRects = {};

  if (savedState && savedState.gridLayouts) gridLayouts = normalizeSavedGridMap(savedState.gridLayouts, sourceGridResolution(savedState));
  else gridLayouts = {};

  if (savedState && savedState.mutes) mutes = savedState.mutes;
  else mutes = {};

  saveSizes();
  saveRects();
  saveGridLayouts();
  saveMutes();
  saveLayout();
  applyLayout();

  for (const tile of startupTiles) {
    addTile(tile.module, {
      temporary: tile.temporary,
      span: tile.span,
      grid: tile.grid,
      rect: tile.rect,
      muted: tile.muted,
    });
  }

  fullRerender();
}

function reflowTilesToLayout({ persist = false } = {}) {
  const placed = [];
  for (const t of tiles) {
    const current = normalizeGridItem({ ...(t.grid || gridFromSpan(t.span)), id: t.id });
    const next = layoutEngine().collides(current, placed, t.id, layoutConfig())
      ? { ...layoutEngine().findOpenSpace(placed, current, layoutConfig()), id: t.id }
      : current;
    applyGrid(t, next);
    placed.push({ ...t.grid, id: t.id });
    if (persist && !t.temporary) {
      sizes[t.id] = t.span;
      tileRects[t.id] = t.rect;
      gridLayouts[t.id] = cleanGridItem(t.grid);
    }
  }
  if (persist) {
    saveSizes();
    saveRects();
    saveGridLayouts();
  }
}

function applyLayout({ persist = false, normalizeTiles = false } = {}) {
  const grid = document.getElementById('grid');
  if (!grid) return;

  layout = normalizeLayout(layout);
  const config = layoutConfig();
  grid.style.setProperty('--grid-cols', String(config.columns));
  grid.style.setProperty('--grid-row-h', `${config.rowHeight}px`);
  grid.style.setProperty('--grid-gap', `${config.gap}px`);
  grid.classList.toggle('raster-unlocked', !layout.locked);
  grid.classList.add('freeform-grid');

  const lockedInput = document.getElementById('layout-locked');
  const columnsInput = document.getElementById('layout-columns');
  const rowHeightInput = document.getElementById('layout-row-height');
  if (lockedInput) lockedInput.checked = layout.locked;
  if (columnsInput) columnsInput.value = layout.columns;
  if (rowHeightInput) rowHeightInput.value = layout.rowHeight;

  if (normalizeTiles) {
    reflowTilesToLayout({ persist });
  } else {
    fullRerender();
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
      title: chaosMode ? 'Turn chaos mode off' : 'Turn chaos mode on',
      meta: `${chaosIntervalSeconds}s focus rotation`,
      keywords: 'brainrot chaos rotate focus',
      run: () => {
        closeCommandPalette();
        setChaosMode(!chaosMode);
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
      meta: `${LAYOUT_PRESETS[key].columns * GRID_RESOLUTION} cells`,
      keywords: 'layout preset grid',
      run: () => {
        closeCommandPalette();
        applyLayoutPreset(key);
      },
    });
  }

  for (const key of Object.keys(ROT_PRESETS)) {
    const preset = rotPreset(key);
    items.push({
      group: 'Rot preset',
      title: preset.label,
      meta: `${preset.modules.length} tiles${preset.customized ? ' · customized' : ''}`,
      keywords: `brainrot preset ${key} feeds doomscroll`,
      run: () => {
        closeCommandPalette();
        selectedRotPresetKey = key;
        applyRotPreset(key);
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
      !document.getElementById('layout-menu').classList.contains('hidden');
    closeAddMenu();
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

function setLayoutMenuTab(tab = activeLayoutMenuTab) {
  activeLayoutMenuTab = ['saved', 'presets', 'grid'].includes(tab) ? tab : 'saved';
  document.querySelectorAll('[data-layout-menu-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layoutMenuTab === activeLayoutMenuTab);
  });
  document.querySelectorAll('[data-layout-menu-panel]').forEach(panel => {
    panel.classList.toggle('hidden', panel.dataset.layoutMenuPanel !== activeLayoutMenuTab);
  });
  if (activeLayoutMenuTab === 'saved') syncSaveLayoutMenu();
  if (activeLayoutMenuTab === 'presets') {
    renderRotPresetControls();
    syncChaosControls();
  }
}

function openLayoutMenu(tab = activeLayoutMenuTab) {
  const menu = document.getElementById('layout-menu');
  menu.classList.remove('hidden');
  closeAddMenu();
  setLayoutMenuTab(tab);
  renderLayoutSlots();
  applyLayout();
}

function toggleLayoutMenu() {
  const menu = document.getElementById('layout-menu');
  if (menu.classList.contains('hidden')) openLayoutMenu(activeLayoutMenuTab || 'saved');
  else closeLayoutMenu();
}

function closeLayoutMenu() {
  document.getElementById('layout-menu').classList.add('hidden');
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

function setFocusedTile(id, { silent = false } = {}) {
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
    if (!silent) showToast(`Focused ${focused.module.name || focused.id}. Press Esc to exit.`);
  }
  updateWorkspaceStatus();
}

function updateWorkspaceStatus() {
  const layoutEl = document.getElementById('status-layout');
  const tilesEl = document.getElementById('status-tiles');
  const rotEl = document.getElementById('status-rot');
  const sessionEl = document.getElementById('status-session');
  const modeEl = document.getElementById('status-mode');
  const chaosEl = document.getElementById('status-chaos');
  if (layoutEl) {
    const label = transientPresetActive
      ? (rotPreset(selectedRotPresetKey)?.label || 'Default Brainrot')
      : (startupDefaultActive ? 'Startup default' : layoutSlotName(currentSlot));
    layoutEl.textContent = `${label} · ${layout.columns * GRID_RESOLUTION} cells`;
  }
  if (tilesEl) {
    const webCount = tiles.filter(t => t.module.type !== 'terminal').length;
    const termCount = tiles.length - webCount;
    tilesEl.textContent = `${tiles.length} tiles · ${webCount} web · ${termCount} term`;
  }
  const sessionLabel = formatSessionTime(Date.now() - sessionStartedAt);
  const rotScore = calculateRotScore();
  const audioCount = tiles.filter(t => t.module.type !== 'terminal' && !t.muted).length;
  if (rotEl) rotEl.textContent = `Rot ${rotScore}`;
  if (sessionEl) sessionEl.textContent = sessionLabel;
  if (chaosEl) chaosEl.textContent = chaosMode ? `Chaos ${chaosIntervalSeconds}s` : 'Chaos off';
  if (modeEl) {
    const focusName = focusedTileId
      ? tiles.find(t => t.id === focusedTileId)?.module.name || focusedTileId
      : null;
    modeEl.textContent = focusName
      ? `Focus: ${focusName}`
      : `${editMode ? 'Editing' : 'Live'} · ${layout.columns * GRID_RESOLUTION}-cell grid`;
  }
  const statTime = document.getElementById('rot-stat-time');
  const statScore = document.getElementById('rot-stat-score');
  const statAudio = document.getElementById('rot-stat-audio');
  const statTiles = document.getElementById('rot-stat-tiles');
  if (statTime) statTime.textContent = sessionLabel;
  if (statScore) statScore.textContent = `Rot ${rotScore}`;
  if (statAudio) statAudio.textContent = `${audioCount} audio`;
  if (statTiles) statTiles.textContent = `${tiles.length} tiles`;
}

function startStatusTimer() {
  if (statusTimer) return;
  statusTimer = window.setInterval(updateWorkspaceStatus, 1000);
}

function formatSessionTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateRotScore() {
  const elapsedMinutes = Math.floor((Date.now() - sessionStartedAt) / 60000);
  const webTiles = tiles.filter(t => t.module.type !== 'terminal').length;
  const loudTiles = tiles.filter(t => t.module.type !== 'terminal' && !t.muted).length;
  const shortformTiles = tiles.filter(t => ['youtube-shorts', 'tiktok', 'instagram'].includes(t.id)).length;
  const chaosBonus = chaosMode ? 25 : 0;
  const focusBonus = focusedTileId ? 10 : 0;
  return elapsedMinutes * 3 + webTiles * 18 + loudTiles * 9 + shortformTiles * 14 + chaosBonus + focusBonus;
}

function syncChaosControls() {
  const enabled = document.getElementById('chaos-enabled');
  const interval = document.getElementById('chaos-interval');
  if (enabled) enabled.checked = chaosMode;
  if (interval) interval.value = chaosIntervalSeconds;
  document.body.classList.toggle('is-chaos', chaosMode);
}

function setChaosMode(on, { silent = false } = {}) {
  chaosMode = !!on;
  localStorage.setItem(CHAOS_MODE_KEY, String(chaosMode));
  if (chaosTimer) {
    window.clearInterval(chaosTimer);
    chaosTimer = null;
  }
  if (chaosMode) {
    chaosTimer = window.setInterval(runChaosTick, chaosIntervalSeconds * 1000);
  } else if (!silent) {
    setFocusedTile(null, { silent: true });
  }
  syncChaosControls();
  updateWorkspaceStatus();
  if (!silent) showToast(chaosMode ? 'Chaos mode on.' : 'Chaos mode off.');
}

function runChaosTick() {
  const candidates = tiles.filter(t => t.module.type !== 'terminal');
  if (!candidates.length) return;
  const currentIndex = candidates.findIndex(t => t.id === focusedTileId);
  const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
  setFocusedTile(next.id, { silent: true });
}

function rotPresetKeys() {
  return Object.keys(ROT_PRESETS);
}

function normalizePresetOverride(key, value) {
  if (!ROT_PRESETS[key] || !value || typeof value !== 'object') return null;
  const modules = Array.isArray(value.modules)
    ? value.modules.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim())
    : null;
  const grids = value.grids && typeof value.grids === 'object' ? value.grids : null;
  const layoutSettings = value.layoutSettings ? normalizeLayout(value.layoutSettings) : null;
  const gridResolution = sourceGridResolution(value);
  return {
    label: String(value.label || ROT_PRESETS[key].label).trim() || ROT_PRESETS[key].label,
    modules: modules && modules.length ? modules : ROT_PRESETS[key].modules,
    grids,
    gridResolution,
    layoutSettings,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : null,
  };
}

function loadRotPresetOverrides() {
  const saved = loadJson(ROT_PRESET_OVERRIDES_KEY, {});
  const overrides = {};
  for (const key of rotPresetKeys()) {
    const normalized = normalizePresetOverride(key, saved[key]);
    if (normalized) overrides[key] = normalized;
  }
  return overrides;
}

function saveRotPresetOverrides() {
  localStorage.setItem(ROT_PRESET_OVERRIDES_KEY, JSON.stringify(rotPresetOverrides));
}

function rotPreset(key) {
  const base = ROT_PRESETS[key];
  if (!base) return null;
  const override = rotPresetOverrides[key];
  return override
    ? { ...base, ...override, customized: true }
    : { ...base, customized: false };
}

function rotPresetManagedIds() {
  return new Set([
    ...Object.values(ROT_PRESETS).flatMap(preset => preset.modules),
    ...Object.values(rotPresetOverrides).flatMap(preset => preset.modules || []),
  ]);
}

function renderRotPresetControls() {
  const list = document.getElementById('rot-preset-list');
  const select = document.getElementById('rot-edit-select');
  if (!list || !select) return;
  list.innerHTML = '';
  select.innerHTML = '';

  for (const key of rotPresetKeys()) {
    const preset = rotPreset(key);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.rotPreset = key;
    btn.className = 'rot-preset-btn';
    btn.classList.toggle('customized', !!preset.customized);
    btn.textContent = preset.customized ? `${preset.label} *` : preset.label;
    list.appendChild(btn);

    const option = document.createElement('option');
    option.value = key;
    option.textContent = preset.customized ? `${preset.label} *` : preset.label;
    select.appendChild(option);
  }

  if (!ROT_PRESETS[selectedRotPresetKey]) selectedRotPresetKey = rotPresetKeys()[0];
  syncRotPresetEditor();
}

function syncRotPresetEditor() {
  const select = document.getElementById('rot-edit-select');
  const labelInput = document.getElementById('rot-edit-label');
  const preset = rotPreset(selectedRotPresetKey);
  if (!select || !labelInput || !preset) return;
  select.value = selectedRotPresetKey;
  labelInput.value = preset.label;
}

function normalizeGridMap(source, modules = [], fromResolution = GRID_RESOLUTION) {
  const map = {};
  if (!source || typeof source !== 'object') return map;
  const ids = modules.length ? modules : Object.keys(source);
  for (const id of ids) {
    if (!source[id]) continue;
    map[id] = cleanGridItem(scaleGridToCurrent({ ...source[id], id }, fromResolution));
  }
  return map;
}

function orderTilesForPreset(preset) {
  const order = new Map(preset.modules.map((id, index) => [id, index]));
  const originalIndex = new Map(tiles.map((tile, index) => [tile.id, index]));
  tiles.sort((a, b) => {
    const ai = order.has(a.id) ? order.get(a.id) : 1000 + (originalIndex.get(a.id) || 0);
    const bi = order.has(b.id) ? order.get(b.id) : 1000 + (originalIndex.get(b.id) || 0);
    return ai - bi;
  });
  const grid = document.getElementById('grid');
  if (grid) tiles.forEach(t => grid.appendChild(t.element));
}

function applyExplicitGrids(gridMap, { persist = false } = {}) {
  sizes = {};
  tileRects = {};
  gridLayouts = {};
  const assigned = new Set(Object.keys(gridMap));
  const placed = [];
  for (const t of tiles) {
    let grid = assigned.has(t.id)
      ? normalizeGridItem({ ...gridMap[t.id], id: t.id })
      : null;
    if (!grid || layoutEngine().collides(grid, placed, t.id, layoutConfig())) {
      const span = grid
        ? { colSpan: grid.colSpan, rowSpan: grid.rowSpan }
        : gridFromSpan(defaultSpanFor(t.module));
      grid = layoutEngine().findOpenSpace(placed, span, layoutConfig());
      grid.id = t.id;
    }
    applyGrid(t, grid);
    if (!t.temporary) {
      sizes[t.id] = t.span;
      tileRects[t.id] = t.rect;
      gridLayouts[t.id] = cleanGridItem(t.grid);
    }
    placed.push({ ...t.grid, id: t.id });
  }
  fullRerender();
  if (persist) {
    saveSizes();
    saveRects();
    saveGridLayouts();
    saveLayout();
    saveCurrentState({ silent: true });
  }
  updateCanvasExtent();
  updateWorkspaceStatus();
}

function applyRotPreset(key) {
  const preset = rotPreset(key);
  if (!preset) return;
  selectedRotPresetKey = key;
  syncRotPresetEditor();
  closeLayoutMenu();
  setFocusedTile(null, { silent: true });
  layout = normalizeLayout(preset.layoutSettings || LAYOUT_PRESETS[preset.layout] || LAYOUT_PRESETS.wide);
  applyLayout({ persist: false });

  const managedIds = rotPresetManagedIds();
  for (const t of [...tiles]) {
    if (managedIds.has(t.id) && !preset.modules.includes(t.id)) {
      removeTile(t.id);
    }
  }

  for (const id of preset.modules) {
    if (tiles.some(t => t.id === id)) continue;
    const module = moduleById(id);
    if (module) addTile(module);
  }

  orderTilesForPreset(preset);
  const grids = normalizeGridMap(preset.grids || {}, preset.modules, preset.gridResolution);
  applyExplicitGrids(grids);
  transientPresetActive = true;
  startupDefaultActive = false;
  showToast(`${preset.label} loaded. Save layout to keep it.`);
}

function currentLayoutSettingsForPreset() {
  return normalizeLayout({
    columns: layout.columns,
    rowHeight: layout.rowHeight,
    gap: layout.gap,
    locked: layout.locked,
  });
}

function saveCurrentWorkspaceAsRotPreset() {
  const key = selectedRotPresetKey;
  const base = ROT_PRESETS[key];
  if (!base) return;

  const modules = tiles
    .map(t => t.id)
    .filter((id, index, ids) => ids.indexOf(id) === index && !!moduleById(id));

  if (!modules.length) {
    showToast('Open at least one saved module before saving a preset.', 'error');
    return;
  }

  const grids = {};
  for (const id of modules) {
    const tile = tiles.find(t => t.id === id);
    if (tile && tile.grid) grids[id] = cleanGridItem(tile.grid);
  }

  const label = document.getElementById('rot-edit-label').value.trim() || base.label;
  rotPresetOverrides[key] = {
    label,
    modules,
    grids,
    gridResolution: GRID_RESOLUTION,
    layoutSettings: currentLayoutSettingsForPreset(),
    savedAt: new Date().toISOString(),
  };
  saveRotPresetOverrides();
  renderRotPresetControls();
  showToast(`Saved preset: ${label}.`);
}

async function resetSelectedRotPreset() {
  const key = selectedRotPresetKey;
  const preset = rotPreset(key);
  if (!preset || !preset.customized) {
    showToast('Preset is already using the default sketch.');
    return;
  }

  const ok = await confirmAction({
    title: 'Reset preset?',
    message: `${preset.label} will return to the PDF sketch default.`,
    confirmLabel: 'Reset',
  });
  if (!ok) return;

  delete rotPresetOverrides[key];
  saveRotPresetOverrides();
  renderRotPresetControls();
  showToast(`Reset preset: ${ROT_PRESETS[key].label}.`);
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
    grid: existing.grid,
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
  grid: requestedGrid = null,
  rect: requestedRect = null,
  muted: requestedMuted = null,
} = {}) {
  if (tiles.some(t => t.id === mod.id)) return;
  const span = normalizeSpan(requestedSpan || sizes[mod.id] || defaultSpanFor(mod));
  const existingItems = gridItems();
  let grid = null;
  if (requestedGrid) {
    grid = normalizeGridItem({ ...requestedGrid, id: mod.id });
  } else if (gridLayouts[mod.id]) {
    grid = normalizeGridItem({ ...gridLayouts[mod.id], id: mod.id });
  } else if (requestedRect || tileRects[mod.id]) {
    grid = layoutEngine().rectToGrid(requestedRect || tileRects[mod.id], layoutConfig(), layoutViewportWidth());
    grid.id = mod.id;
  }
  if (!grid || layoutEngine().collides(grid, existingItems, mod.id, layoutConfig())) {
    grid = layoutEngine().findOpenSpace(existingItems, gridFromSpan(span), layoutConfig());
    grid.id = mod.id;
  }
  const rect = layoutEngine().gridToRect(grid, layoutConfig(), layoutViewportWidth());
  const muted = requestedMuted == null ? mutes[mod.id] === true : !!requestedMuted;
  const record = {
    id: mod.id,
    module: mod,
    span: spanFromGrid(grid),
    grid,
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
  applyGrid(record, grid);
  document.getElementById('grid').appendChild(el);
  tiles.push(record);
  updateCanvasExtent();
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
  updateWorkspaceStatus();
}

function applySpan(record, span) {
  record.span = normalizeSpan(span);
  if (record.sizeBtn) record.sizeBtn.title = `Preset ${spanLabel(record.span)}`;
}

function setSpan(id, span, { persist = true } = {}) {
  const t = tiles.find(x => x.id === id);
  if (!t) return;
  const nextSpan = normalizeSpan(span);
  const nextGrid = {
    ...(t.grid || { col: 0, row: 0 }),
    ...gridFromSpan(nextSpan),
    id,
  };
  if (!setGrid(id, nextGrid, { persist })) {
    const open = layoutEngine().findOpenSpace(
      gridItems().filter(item => item.id !== id),
      gridFromSpan(nextSpan),
      layoutConfig()
    );
    setGrid(id, { ...open, id }, { persist });
  }
  if (persist && !t.temporary) {
    sizes[id] = t.span;
    saveSizes();
  }
}

function applyGrid(record, grid) {
  const item = normalizeGridItem({ ...(grid || {}), id: record.id }, record.grid || gridFromSpan(record.span));
  record.grid = { ...item, id: record.id };
  record.rect = layoutEngine().gridToRect(record.grid, layoutConfig(), layoutViewportWidth());
  record.span = spanFromGrid(record.grid);

  const el = record.element;
  if (el) {
    el.style.left = `${record.rect.x}px`;
    el.style.top = `${record.rect.y}px`;
    el.style.width = `${record.rect.w}px`;
    el.style.height = `${record.rect.h}px`;
  }

  if (record.sizeBtn) {
    record.sizeBtn.textContent = gridLabel(record.grid);
    record.sizeBtn.title = 'Cycle preset size; drag edges or corners in Edit mode for cell resize';
  }
}

function fullRerender() {
  for (const t of tiles) {
    const grid = t.grid || (t.rect ? rectToGrid(t.rect, t.id) : { ...gridFromSpan(t.span), id: t.id });
    applyGrid(t, grid);
  }
  updateCanvasExtent();
}

function updateEditButton() {
  const btn = document.getElementById('edit-mode-btn');
  if (!btn) return;
  btn.classList.toggle('active', editMode);
  btn.textContent = editMode ? '● Editing' : '✎ Edit';
  btn.title = editMode
    ? 'Exit edit mode (saves grid layout, tiles resize with window)'
    : 'Enter edit mode (drag/resize tiles on the grid)';

  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.hidden = !editMode;
}

function setEditMode(on) {
  const was = editMode;
  editMode = !!on;
  document.body.classList.toggle('is-editing', editMode);
  saveEditMode();

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
  restoreSlot(currentSlot);
  updateEditButton();
  flashSaveButton('Edit canceled');
}

function sameGrid(a, b) {
  return !!a && !!b &&
    a.col === b.col &&
    a.row === b.row &&
    a.colSpan === b.colSpan &&
    a.rowSpan === b.rowSpan;
}

function currentTileGridMap() {
  const map = new Map();
  for (const t of tiles) {
    map.set(t.id, normalizeGridItem({ ...(t.grid || gridFromSpan(t.span)), id: t.id }));
  }
  return map;
}

function addPushOption(options, item, blocker, col, row, priority) {
  const next = normalizeGridItem({ ...item, col, row, id: item.id }, item);
  if (!layoutEngine().overlaps(next, blocker)) {
    options.push({ item: next, priority });
  }
}

function pushItemAway(item, blocker, direction, map) {
  const options = [];
  let priority = 0;

  if (direction.includes('e')) addPushOption(options, item, blocker, blocker.col + blocker.colSpan, item.row, priority++);
  if (direction.includes('w')) addPushOption(options, item, blocker, blocker.col - item.colSpan, item.row, priority++);
  if (direction.includes('s')) addPushOption(options, item, blocker, item.col, blocker.row + blocker.rowSpan, priority++);
  if (direction.includes('n')) addPushOption(options, item, blocker, item.col, blocker.row - item.rowSpan, priority++);

  addPushOption(options, item, blocker, item.col, blocker.row + blocker.rowSpan, priority++);
  addPushOption(options, item, blocker, blocker.col + blocker.colSpan, item.row, priority++);
  addPushOption(options, item, blocker, Math.max(0, blocker.col - item.colSpan), item.row, priority++);
  addPushOption(options, item, blocker, item.col, Math.max(0, blocker.row - item.rowSpan), priority++);

  if (options.length) {
    options.sort((a, b) => {
      const costA = a.priority * 1000 + Math.abs(a.item.col - item.col) + Math.abs(a.item.row - item.row);
      const costB = b.priority * 1000 + Math.abs(b.item.col - item.col) + Math.abs(b.item.row - item.row);
      return costA - costB;
    });
    return options[0].item;
  }

  const occupied = Array.from(map.values()).filter(other => other.id !== item.id);
  const open = layoutEngine().findOpenSpace(occupied, item, layoutConfig());
  open.id = item.id;
  return open;
}

function resolvePushedGridMap(activeId, candidateGrid, direction, baseMap = currentTileGridMap()) {
  const map = new Map();
  for (const [id, item] of baseMap.entries()) {
    map.set(id, normalizeGridItem({ ...item, id }));
  }

  const active = normalizeGridItem({ ...(candidateGrid || {}), id: activeId }, map.get(activeId));
  map.set(activeId, active);

  const changed = new Set([activeId]);
  const queue = [active];
  let guard = 0;
  const maxGuard = Math.max(80, tiles.length * tiles.length * 8);

  while (queue.length && guard < maxGuard) {
    guard++;
    const blocker = queue.shift();
    for (const [id, item] of map.entries()) {
      if (id === blocker.id) continue;
      if (!layoutEngine().overlaps(blocker, item)) continue;
      const next = pushItemAway(item, blocker, direction, map);
      if (!next || sameGrid(next, item)) return null;
      map.set(id, next);
      changed.add(id);
      queue.push(next);
    }
  }

  if (guard >= maxGuard) return null;

  const items = Array.from(map.values());
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (layoutEngine().overlaps(items[i], items[j])) return null;
    }
  }

  return { map, changed };
}

function persistTileGeometryBatch(records) {
  for (const record of records) {
    if (!record || record.temporary) continue;
    sizes[record.id] = record.span;
    tileRects[record.id] = record.rect;
    gridLayouts[record.id] = cleanGridItem(record.grid);
  }
  saveSizes();
  saveRects();
  saveGridLayouts();
}

function applyTileGridMap(map, changed = null, { persist = false } = {}) {
  const changedRecords = [];
  for (const t of tiles) {
    const grid = map.get(t.id);
    if (!grid) continue;
    const didChange = !sameGrid(t.grid, grid);
    applyGrid(t, grid);
    if (didChange || !changed || changed.has(t.id)) changedRecords.push(t);
  }
  updateCanvasExtent();
  if (persist) persistTileGeometryBatch(changedRecords);
}

function persistTileGeometry(record) {
  if (!record || record.temporary) return;
  persistTileGeometryBatch([record]);
}

function setGrid(id, grid, { persist = true, allowCollision = false, push = false, direction = 's', baseMap = null } = {}) {
  const t = tiles.find(x => x.id === id);
  if (!t) return false;
  const nextGrid = normalizeGridItem({ ...(grid || {}), id }, t.grid || gridFromSpan(t.span));
  if (push) {
    const pushed = resolvePushedGridMap(id, nextGrid, direction, baseMap || currentTileGridMap());
    if (!pushed) return false;
    applyTileGridMap(pushed.map, pushed.changed, { persist });
    return true;
  }
  if (!allowCollision && layoutEngine().collides(nextGrid, gridItems(), id, layoutConfig())) {
    return false;
  }
  applyGrid(t, nextGrid);
  updateCanvasExtent();
  if (persist) persistTileGeometry(t);
  return true;
}

function updateCanvasExtent() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const config = layoutConfig();
  const cellW = layoutEngine().cellWidth(config, layoutViewportWidth());
  const size = layoutEngine().canvasSize(gridItems(), config, layoutViewportWidth());
  grid.style.setProperty('--grid-pad', `${config.pad}px`);
  grid.style.setProperty('--grid-cell-w', `${cellW}px`);
  grid.style.setProperty('--grid-step-x', `${cellW + config.gap}px`);
  grid.style.setProperty('--grid-step-y', `${config.rowHeight + config.gap}px`);
  grid.style.setProperty('--canvas-w', `${Math.ceil(size.w)}px`);
  grid.style.setProperty('--canvas-h', `${Math.ceil(size.h)}px`);
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

function startTileDrag(event, record) {
  if (!editMode) return;
  if (!record.element) return;
  if (event.button !== 0) return;
  if (event.target.closest('button, input, select, textarea, .tabs, .actions')) return;
  event.preventDefault();

  const startX = event.clientX;
  const startY = event.clientY;
  const startGrid = normalizeGridItem({ ...(record.grid || {}), id: record.id });
  const unit = gridUnitSize();
  let dragging = false;
  let frame = 0;
  let nextGrid = startGrid;

  bringToFront(record);

  const applyNext = () => {
    frame = 0;
    setGrid(record.id, nextGrid, { persist: false });
  };

  const onMove = e => {
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < 5 && Math.abs(e.clientY - startY) < 5) return;
      dragging = true;
      document.body.classList.add('is-dragging');
      record.element.classList.add('dragging');
    }
    nextGrid = normalizeGridItem({
      ...startGrid,
      col: startGrid.col + Math.round((e.clientX - startX) / unit.col),
      row: startGrid.row + Math.round((e.clientY - startY) / unit.row),
      id: record.id,
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
    if (dragging) setGrid(record.id, nextGrid, { persist: true });
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
}

function startTileResize(event, record, direction = 'se') {
  if (!editMode) return;
  if (!record.element) return;
  event.preventDefault();
  event.stopPropagation();

  const startX = event.clientX;
  const startY = event.clientY;
  const startMap = currentTileGridMap();
  const startGrid = normalizeGridItem({ ...(record.grid || {}), id: record.id });
  const unit = gridUnitSize();
  let frame = 0;
  let nextGrid = startGrid;
  let lastAppliedGrid = startGrid;

  bringToFront(record);
  document.body.classList.add('is-resizing');
  record.element.classList.add('resizing');

  const applyNext = () => {
    frame = 0;
    if (setGrid(record.id, nextGrid, {
      persist: false,
      push: true,
      direction,
      baseMap: startMap,
    })) {
      lastAppliedGrid = nextGrid;
    }
  };

  const move = e => {
    const deltaCols = Math.round((e.clientX - startX) / unit.col);
    const deltaRows = Math.round((e.clientY - startY) / unit.row);
    nextGrid = layoutEngine().resizeItem(startGrid, direction, deltaCols, deltaRows, layoutConfig());
    nextGrid.id = record.id;
    if (!frame) frame = requestAnimationFrame(applyNext);
  };

  const stop = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
    if (frame) cancelAnimationFrame(frame);
    document.body.classList.remove('is-resizing');
    record.element.classList.remove('resizing');
    if (!setGrid(record.id, nextGrid, {
      persist: true,
      push: true,
      direction,
      baseMap: startMap,
    }) && !sameGrid(lastAppliedGrid, nextGrid)) {
      setGrid(record.id, lastAppliedGrid, {
        persist: true,
        push: true,
        direction,
        baseMap: startMap,
      });
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
  gridLayouts = {};
  saveSizes();
  saveRects();
  saveGridLayouts();
  saveLayout();

  const placed = [];
  for (const t of tiles) {
    const span = defaultSpanFor(t.module);
    const grid = layoutEngine().findOpenSpace(placed, gridFromSpan(span), layoutConfig());
    grid.id = t.id;
    applyGrid(t, grid);
    if (!t.temporary) {
      sizes[t.id] = t.span;
      tileRects[t.id] = t.rect;
      gridLayouts[t.id] = cleanGridItem(t.grid);
    }
    placed.push({ ...t.grid, id: t.id });
  }
  fullRerender();
  saveSizes();
  saveRects();
  saveGridLayouts();
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

function createWorkspaceSnapshot() {
  const nextSizes = {};
  const nextRects = {};
  const nextGrids = {};
  const nextMutes = { ...mutes };
  for (const t of tiles) {
    if (!t.temporary) nextSizes[t.id] = t.span;
    if (!t.temporary) nextRects[t.id] = t.rect;
    if (!t.temporary) nextGrids[t.id] = cleanGridItem(t.grid);
    nextMutes[t.id] = !!t.muted;
  }

  return {
    snapshot: {
      version: 2,
      gridResolution: GRID_RESOLUTION,
      savedAt: new Date().toISOString(),
      layout: normalizeLayout(layout),
      sizes: nextSizes,
      rects: nextRects,
      gridLayouts: nextGrids,
      mutes: nextMutes,
      tiles: tiles.map(t => ({
        id: t.id,
        temporary: !!t.temporary,
        span: t.span,
        rect: t.rect,
        grid: cleanGridItem(t.grid),
        muted: !!t.muted,
        currentUrl: tileCurrentUrl(t),
        module: moduleForSnapshot(t),
      })),
    },
    sizes: nextSizes,
    rects: nextRects,
    gridLayouts: nextGrids,
    mutes: nextMutes,
  };
}

function saveStartupDefault({ silent = false } = {}) {
  const { snapshot } = createWorkspaceSnapshot();
  localStorage.setItem(STARTUP_STATE_KEY, JSON.stringify(snapshot));
  if (silent) return;
  flashSaveButton('Default saved');
  showToast('Current layout will open on startup.');
}

function saveCurrentState({ silent = false, slot = currentSlot, name = null } = {}) {
  const slotId = String(slot || currentSlot);
  if (slotId === currentSlot) {
    transientPresetActive = false;
    startupDefaultActive = false;
  }
  const next = createWorkspaceSnapshot();
  const { snapshot } = next;

  sizes = next.sizes;
  tileRects = next.rects;
  gridLayouts = next.gridLayouts;
  mutes = next.mutes;
  saveSizes();
  saveRects();
  saveGridLayouts();
  saveMutes();
  saveLayout();
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
  const btn = document.getElementById('layout-btn');
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
  sizeBtn.textContent = gridLabel(record.grid);
  sizeBtn.title = 'Cycle preset size; drag edges or corners in Edit mode for cell resize';
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
