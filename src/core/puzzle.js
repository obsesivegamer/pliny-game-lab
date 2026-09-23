import { attachTouchBridge, detachTouchBridge } from './touch.js';

const fallbackProgress = new Map();
const COLORS = {
  ink: '#173F48', sand: '#F3ECDA', paper: '#FFFCF2', teal: '#168B88',
  gold: '#E0A347', coral: '#E66D58', line: '#C8D5C8'
};

export function getProgress(key, count) {
  let saved;
  try { saved = localStorage.getItem(`pliny:puzzle:${key}`); }
  catch { saved = fallbackProgress.get(key); }
  if (saved === null) saved = fallbackProgress.get(key);
  const number = Number(saved);
  return Number.isInteger(number) ? Math.max(0, Math.min(count - 1, number)) : 0;
}

export function setProgress(key, index) {
  const value = String(index);
  fallbackProgress.set(key, value);
  try { localStorage.setItem(`pliny:puzzle:${key}`, value); } catch {}
}

export function boardRect(width, height, cols, rows, options = {}) {
  const reserved = width >= 769 || (width >= 650 && height <= 500) ? 350 : 0;
  const usableWidth = width - reserved;
  const topSpace = options.topSpace ?? 70;
  const bottomSpace = options.bottomSpace ?? 20;
  const insetLeft = options.insetLeft ?? 0;
  const insetTop = options.insetTop ?? 0;
  const cell = Math.max(1, Math.min(78, (usableWidth - 36 - insetLeft) / cols,
    (height - topSpace - bottomSpace - insetTop) / rows));
  const boardWidth = cols * cell + insetLeft;
  const boardHeight = rows * cell + insetTop;
  return {
    x: Math.max(8, (usableWidth - boardWidth) / 2) + insetLeft,
    y: Math.max(topSpace, topSpace + (height - topSpace - bottomSpace - boardHeight) / 2) + insetTop,
    cell, cols, rows, width: cols * cell, height: rows * cell,
    insetLeft, insetTop
  };
}

export function cellAt(rect, x, y) {
  const col = Math.floor((x - rect.x) / rect.cell);
  const row = Math.floor((y - rect.y) / rect.cell);
  return col >= 0 && row >= 0 && col < rect.cols && row < rect.rows ? [col, row] : null;
}

export function paintBoard(ctx, width, height, dpr, title, subtitle, rect) {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#E5EAD8';
  ctx.fillRect(0, 0, width >= 769 || (width >= 650 && height <= 500) ? width - 350 : width, 7);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.ink;
  ctx.font = `700 ${Math.min(29, Math.max(19, width / 23))}px system-ui`;
  const center = rect.x + rect.width / 2 - rect.insetLeft / 2;
  ctx.fillText(title, center, 27);
  ctx.font = '600 13px system-ui';
  ctx.fillStyle = '#41646B';
  ctx.fillText(subtitle, center, 52);
  ctx.restore();
}

export function drawCell(ctx, rect, col, row, fill = COLORS.paper, stroke = COLORS.line, radius = 7) {
  const pad = Math.max(1, rect.cell * 0.035);
  const x = rect.x + col * rect.cell + pad;
  const y = rect.y + row * rect.cell + pad;
  const size = rect.cell - pad * 2;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, rect.cell * 0.025);
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, Math.min(radius, size / 4));
  ctx.fill();
  ctx.stroke();
}

export function drawSymbol(ctx, rect, col, row, symbol, color = COLORS.ink, scale = 0.46) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.max(12, rect.cell * scale)}px system-ui`;
  ctx.fillText(String(symbol), rect.x + (col + 0.5) * rect.cell, rect.y + (row + 0.52) * rect.cell);
}

export class LevelPuzzleEngine {
  constructor(spec, canvas, ctx, controlsContainer) {
    this.spec = spec;
    this.canvas = canvas;
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute?.('aria-label', `${spec.title} puzzle board`);
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = 1;
    this.levelIndex = getProgress(spec.key, spec.levels.length);
    this.history = [];
    this.message = '';
    this.cursor = null;
    this.loadLevel(this.levelIndex);
    this.mountControls();
    attachTouchBridge(this, canvas);
  }

  loadLevel(index) {
    this.levelIndex = Math.max(0, Math.min(this.spec.levels.length - 1, index));
    this.state = this.spec.makeState(this.spec.levels[this.levelIndex]);
    this.history = [];
    this.message = '';
    this.cursor = null;
    this.refreshControls();
  }

  resize(width, height, dpr) { this.width = width; this.height = height; this.dpr = dpr || 1; }
  uiScale() { return this.dpr || 1; }
  update() {}
  getLevel() { return this.spec.levels[this.levelIndex]; }
  getRect() {
    const size = this.spec.size(this.getLevel(), this.state);
    return boardRect(this.width / this.dpr, this.height / this.dpr, size[0], size[1], this.spec.boardOptions || {});
  }
  getEntityCount() {
    const [cols, rows] = this.spec.size(this.getLevel(), this.state);
    return cols * rows;
  }
  commit(next) {
    if (!next || next === this.state || this.spec.won(this.state, this.getLevel())) return;
    this.history.push(structuredClone(this.state));
    this.state = next;
    this.message = '';
    if (this.spec.won(next, this.getLevel())) {
      this.message = this.levelIndex === this.spec.levels.length - 1 ?
        'You finished every puzzle. Wonderful work!' : 'Solved! The next puzzle is ready.';
      setProgress(this.spec.key, Math.max(getProgress(this.spec.key, this.spec.levels.length), this.levelIndex + 1));
    }
    this.refreshControls();
  }
  undo() {
    if (!this.history.length) return;
    this.state = this.history.pop();
    this.message = '';
    this.refreshControls();
  }
  reset() { this.loadLevel(this.levelIndex); }
  hint() {
    if (this.spec.won(this.state, this.getLevel())) return;
    this.message = this.spec.hint(this.state, this.getLevel(), this) || 'Try a different move.';
    this.refreshControls();
  }
  onMouseDown(mouse) {
    this.pointerHeld = true;
    this.canvas.focus?.();
    const point = cellAt(this.getRect(), mouse.rawX ?? mouse.x / this.dpr, mouse.rawY ?? mouse.y / this.dpr);
    if (point) this.commit(this.spec.select(this.state, this.getLevel(), ...point, this));
  }
  onMouseMove(mouse) {
    if (!this.pointerHeld || !this.spec.drag) return;
    const point = cellAt(this.getRect(), mouse.rawX ?? mouse.x / this.dpr, mouse.rawY ?? mouse.y / this.dpr);
    if (point) this.commit(this.spec.drag(this.state, this.getLevel(), ...point, this));
  }
  onMouseUp() { this.pointerHeld = false; }
  onKeyDown(key, event) {
    if (event?.ctrlKey || event?.metaKey || event?.altKey) {
      if (key.toLowerCase() === 'z' && !event.altKey) {
        event.preventDefault?.();
        this.undo();
      }
      return;
    }
    if ((key === 'Enter' || key === ' ') && event?.target?.tagName === 'BUTTON') return;
    const next = this.spec.won(this.state, this.getLevel()) ? null :
      this.spec.keyboard?.(this.state, this.getLevel(), key, this);
    if (next) { event?.preventDefault?.(); this.commit(next); return; }
    const direction = { ArrowUp: [0, -1], ArrowRight: [1, 0],
      ArrowDown: [0, 1], ArrowLeft: [-1, 0] }[key];
    if (direction) {
      const [cols, rows] = this.spec.size(this.getLevel(), this.state);
      const [x, y] = this.cursor || [0, 0];
      this.cursor = [Math.max(0, Math.min(cols - 1, x + direction[0])),
        Math.max(0, Math.min(rows - 1, y + direction[1]))];
      event?.preventDefault?.();
      return;
    }
    if ((key === 'Enter' || key === ' ') && this.cursor) {
      event?.preventDefault?.();
      this.commit(this.spec.select(this.state, this.getLevel(), ...this.cursor, this));
    }
  }
  render(ctx) {
    const dpr = this.dpr || 1;
    const rect = this.getRect();
    paintBoard(ctx, this.width / dpr, this.height / dpr, dpr,
      this.spec.title, `Puzzle ${this.levelIndex + 1} of ${this.spec.levels.length}`, rect);
    ctx.save();
    ctx.scale(dpr, dpr);
    this.spec.draw(ctx, this.state, this.getLevel(), rect, this);
    if (this.cursor) {
      ctx.strokeStyle = '#E46E55';
      ctx.lineWidth = Math.max(3, rect.cell * 0.055);
      ctx.strokeRect(rect.x + this.cursor[0] * rect.cell + 2,
        rect.y + this.cursor[1] * rect.cell + 2, rect.cell - 4, rect.cell - 4);
    }
    ctx.restore();
  }
  mountControls() {
    if (!this.controlsContainer) return;
    this.controlsContainer.innerHTML = `<section class="puzzle-controls" aria-label="${this.spec.title} controls">
      <p class="puzzle-goal">${this.spec.goal}</p>
      <p class="puzzle-rule">${this.spec.rule}</p>
      <p class="puzzle-status" role="status" aria-live="polite"></p>
      ${this.spec.extraControls || ''}
      <div class="puzzle-actions">
        <button type="button" data-puzzle-action="hint">Hint</button>
        <button type="button" data-puzzle-action="undo">Undo</button>
        <button type="button" data-puzzle-action="reset">Retry</button>
        <button type="button" data-puzzle-action="previous">Previous</button>
        <button type="button" data-puzzle-action="next">Next</button>
      </div></section>`;
    this.controlClick = event => {
      const action = event.target.closest?.('[data-puzzle-action]')?.dataset.puzzleAction;
      if (!action) return;
      if (action === 'hint') this.hint();
      else if (action === 'undo') this.undo();
      else if (action === 'reset') this.reset();
      else if (action === 'previous') this.loadLevel(this.levelIndex - 1);
      else if (action === 'next' && (this.spec.won(this.state, this.getLevel()) ||
        this.levelIndex < getProgress(this.spec.key, this.spec.levels.length))) {
        this.loadLevel(this.levelIndex + 1);
      } else this.spec.action?.(action, this);
    };
    this.controlsContainer.addEventListener?.('click', this.controlClick);
    this.refreshControls();
  }
  refreshControls() {
    const status = this.controlsContainer?.querySelector?.('.puzzle-status');
    if (status) status.textContent = this.message ||
      (this.spec.won(this.state, this.getLevel()) ? 'Solved!' :
        this.spec.status?.(this.state, this.getLevel(), this) || `Puzzle ${this.levelIndex + 1}: ${this.spec.goal}`);
    const previous = this.controlsContainer?.querySelector?.('[data-puzzle-action="previous"]');
    const next = this.controlsContainer?.querySelector?.('[data-puzzle-action="next"]');
    const undo = this.controlsContainer?.querySelector?.('[data-puzzle-action="undo"]');
    if (previous) previous.disabled = this.levelIndex === 0;
    if (next) next.disabled = this.levelIndex === this.spec.levels.length - 1 ||
      (!this.spec.won(this.state, this.getLevel()) && this.levelIndex >= getProgress(this.spec.key, this.spec.levels.length));
    if (undo) undo.disabled = this.history.length === 0;
    this.spec.refresh?.(this);
  }
  destroy() {
    detachTouchBridge(this, this.canvas);
    this.canvas.removeAttribute?.('aria-label');
    if (this.controlsContainer && this.controlClick) this.controlsContainer.removeEventListener?.('click', this.controlClick);
  }
}

export { COLORS };
