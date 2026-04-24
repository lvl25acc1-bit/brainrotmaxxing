(function () {
  const DEFAULT_CONFIG = {
    columns: 12,
    rowHeight: 76,
    gap: 8,
    pad: 8,
    minColSpan: 1,
    minRowSpan: 1,
    maxRowSpan: 40,
  };

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeConfig(value = {}) {
    return {
      columns: clampInt(value.columns, 8, 48, DEFAULT_CONFIG.columns),
      rowHeight: clampInt(value.rowHeight, 48, 180, DEFAULT_CONFIG.rowHeight),
      gap: clampInt(value.gap, 0, 16, DEFAULT_CONFIG.gap),
      pad: clampInt(value.pad, 0, 48, DEFAULT_CONFIG.pad),
      minColSpan: clampInt(value.minColSpan, 1, 8, DEFAULT_CONFIG.minColSpan),
      minRowSpan: clampInt(value.minRowSpan, 1, 8, DEFAULT_CONFIG.minRowSpan),
      maxRowSpan: clampInt(value.maxRowSpan, 4, 80, DEFAULT_CONFIG.maxRowSpan),
    };
  }

  function cellWidth(config, viewportWidth) {
    const c = normalizeConfig(config);
    const width = Math.max(Number(viewportWidth) || 0, 320);
    return Math.max(40, (width - c.pad * 2 - c.gap * (c.columns - 1)) / c.columns);
  }

  function normalizeItem(item = {}, config = DEFAULT_CONFIG) {
    const c = normalizeConfig(config);
    const colSpan = clampInt(item.colSpan, c.minColSpan, c.columns, 2);
    const rowSpan = clampInt(item.rowSpan, c.minRowSpan, c.maxRowSpan, 3);
    return {
      id: item.id == null ? null : String(item.id),
      col: clampInt(item.col, 0, c.columns - colSpan, 0),
      row: clampInt(item.row, 0, 1000, 0),
      colSpan,
      rowSpan,
    };
  }

  function gridToRect(item, config, viewportWidth) {
    const c = normalizeConfig(config);
    const i = normalizeItem(item, c);
    const cw = cellWidth(c, viewportWidth);
    return {
      x: c.pad + i.col * (cw + c.gap),
      y: c.pad + i.row * (c.rowHeight + c.gap),
      w: i.colSpan * cw + Math.max(0, i.colSpan - 1) * c.gap,
      h: i.rowSpan * c.rowHeight + Math.max(0, i.rowSpan - 1) * c.gap,
    };
  }

  function rectToGrid(rect = {}, config, viewportWidth) {
    const c = normalizeConfig(config);
    const cw = cellWidth(c, viewportWidth);
    const unitX = cw + c.gap;
    const unitY = c.rowHeight + c.gap;
    const col = Math.round(((Number(rect.x) || c.pad) - c.pad) / unitX);
    const row = Math.round(((Number(rect.y) || c.pad) - c.pad) / unitY);
    const colSpan = Math.round(((Number(rect.w) || cw) + c.gap) / unitX);
    const rowSpan = Math.round(((Number(rect.h) || c.rowHeight) + c.gap) / unitY);
    return normalizeItem({ col, row, colSpan, rowSpan }, c);
  }

  function overlaps(a, b) {
    return a.col < b.col + b.colSpan &&
      a.col + a.colSpan > b.col &&
      a.row < b.row + b.rowSpan &&
      a.row + a.rowSpan > b.row;
  }

  function collides(item, items, ignoreId = item && item.id, config = DEFAULT_CONFIG) {
    const c = normalizeConfig(config);
    const candidate = normalizeItem(item, c);
    return items.some(other => {
      if (!other) return false;
      if (ignoreId != null && String(other.id) === String(ignoreId)) return false;
      return overlaps(candidate, normalizeItem(other, c));
    });
  }

  function placeItem(items, candidate, config) {
    const c = normalizeConfig(config);
    const next = normalizeItem(candidate, c);
    const previous = items.find(item => String(item.id) === String(next.id));
    if (collides(next, items, next.id, c)) return previous ? normalizeItem(previous, c) : null;
    return next;
  }

  function findOpenSpace(items, span, config) {
    const c = normalizeConfig(config);
    const colSpan = clampInt(span && span.colSpan, 1, c.columns, clampInt(span && span.cols, 1, c.columns, 2));
    const rowSpan = clampInt(span && span.rowSpan, 1, c.maxRowSpan, clampInt(span && span.rows, 1, c.maxRowSpan, 3));
    for (let row = 0; row < 200; row++) {
      for (let col = 0; col <= c.columns - colSpan; col++) {
        const candidate = normalizeItem({ col, row, colSpan, rowSpan }, c);
        if (!collides(candidate, items, null, c)) return candidate;
      }
    }
    const bottom = items.reduce((max, item) => Math.max(max, item.row + item.rowSpan), 0);
    return normalizeItem({ col: 0, row: bottom, colSpan, rowSpan }, c);
  }

  function resizeItem(item, direction, deltaCols, deltaRows, config) {
    const c = normalizeConfig(config);
    const start = normalizeItem(item, c);
    let col = start.col;
    let row = start.row;
    let colSpan = start.colSpan;
    let rowSpan = start.rowSpan;

    if (direction.includes('e')) colSpan += deltaCols;
    if (direction.includes('s')) rowSpan += deltaRows;
    if (direction.includes('w')) {
      col += deltaCols;
      colSpan -= deltaCols;
    }
    if (direction.includes('n')) {
      row += deltaRows;
      rowSpan -= deltaRows;
    }

    return normalizeItem({ id: start.id, col, row, colSpan, rowSpan }, c);
  }

  function canvasSize(items, config, viewportWidth) {
    const c = normalizeConfig(config);
    const width = Math.max(Number(viewportWidth) || 0, 320);
    let maxRow = 1;
    for (const item of items) {
      const i = normalizeItem(item, c);
      maxRow = Math.max(maxRow, i.row + i.rowSpan);
    }
    return {
      w: width,
      h: c.pad * 2 + maxRow * c.rowHeight + Math.max(0, maxRow - 1) * c.gap,
    };
  }

  window.BrainrotLayoutEngine = {
    normalizeConfig,
    normalizeItem,
    gridToRect,
    rectToGrid,
    overlaps,
    collides,
    placeItem,
    findOpenSpace,
    resizeItem,
    canvasSize,
    cellWidth,
  };
})();
