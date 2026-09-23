import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';
import { boardRect, cellAt, paintBoard, drawCell, COLORS } from '../../core/puzzle.js';
import { createStoneState, moveStone, rotateStone, stepStone, hardDropStone,
  shapeCells, STONE_WIDTH, STONE_HEIGHT } from './logic.js';

function bestScore() {
  try { return Number(localStorage.getItem('pliny:puzzle:stonefall:best')) || 0; }
  catch { return 0; }
}

export class StonefallEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = 1;
    this.state = createStoneState();
    this.best = bestScore();
    this.elapsed = 0;
    this.paused = false;
    this.mountControls();
    attachTouchBridge(this, canvas);
  }
  resize(width, height, dpr) { this.width = width; this.height = height; this.dpr = dpr || 1; }
  uiScale() { return this.dpr || 1; }
  reset() { this.state = createStoneState(); this.elapsed = 0; this.refreshControls(); }
  setPaused(paused) { this.paused = paused; this.refreshControls(); }
  apply(action) {
    if (this.paused) return;
    const previous = this.state;
    this.state = action === 'left' ? moveStone(previous, -1, 0) :
      action === 'right' ? moveStone(previous, 1, 0) :
      action === 'rotate' ? rotateStone(previous) :
      action === 'down' ? stepStone(previous) :
      action === 'drop' ? hardDropStone(previous) : previous;
    if (this.state.score > this.best) {
      this.best = this.state.score;
      try { localStorage.setItem('pliny:puzzle:stonefall:best', String(this.best)); } catch {}
    }
    if (this.state !== previous) this.refreshControls();
  }
  update(dt) {
    if (this.state.gameOver) return;
    this.elapsed += dt;
    const interval = Math.max(0.18, 0.78 - this.state.lines * 0.025);
    if (this.elapsed >= interval) { this.elapsed = 0; this.apply('down'); }
  }
  onKeyDown(key, event) {
    if (event?.ctrlKey || event?.metaKey || event?.altKey) return;
    const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate',
      ArrowDown: 'down', ' ': 'drop', x: 'rotate', X: 'rotate' }[key];
    if (!action || this.paused) return;
    event?.preventDefault?.();
    this.apply(action);
  }
  onMouseDown(mouse) {
    const rect = boardRect(this.width / this.dpr, this.height / this.dpr, STONE_WIDTH, STONE_HEIGHT,
      { topSpace: 78, bottomSpace: 9 });
    const cell = cellAt(rect, mouse.rawX ?? mouse.x / this.dpr, mouse.rawY ?? mouse.y / this.dpr);
    if (!cell) return;
    this.apply(cell[0] < 3 ? 'left' : cell[0] > 4 ? 'right' : 'rotate');
  }
  mountControls() {
    if (!this.controlsContainer) return;
    this.controlsContainer.innerHTML = `<section class="puzzle-controls" aria-label="Stonefall controls">
      <p class="puzzle-goal">Complete rows before the stones reach the top.</p>
      <p class="puzzle-rule">Move left or right, rotate, and drop. Each stone has three squares.</p>
      <p class="puzzle-status" role="status" aria-live="polite"></p>
      <div class="puzzle-dpad stonefall-pad">
        <button type="button" data-stone-action="left" aria-label="Move left">←</button>
        <button type="button" data-stone-action="rotate" aria-label="Rotate">↻</button>
        <button type="button" data-stone-action="right" aria-label="Move right">→</button>
        <button type="button" data-stone-action="down" aria-label="Move down">↓</button>
        <button type="button" data-stone-action="drop" aria-label="Drop stone">Drop</button>
      </div>
      <div class="puzzle-actions"><button type="button" data-stone-action="retry">Retry</button></div>
    </section>`;
    this.controlClick = event => {
      const action = event.target.closest?.('[data-stone-action]')?.dataset.stoneAction;
      if (action === 'retry') this.reset();
      else if (action) this.apply(action);
    };
    this.controlsContainer.addEventListener?.('click', this.controlClick);
    this.refreshControls();
  }
  refreshControls() {
    const status = this.controlsContainer?.querySelector?.('.puzzle-status');
    if (status) status.textContent = this.state.gameOver ?
      `Game over. ${this.state.lines} rows cleared. Press Retry to play again.` :
      `${this.paused ? 'Paused · ' : ''}Score ${this.state.score} · Rows ${this.state.lines} · Best ${this.best} · Next ${this.state.next}`;
  }
  render(ctx) {
    const dpr = this.dpr || 1;
    const rect = boardRect(this.width / dpr, this.height / dpr, STONE_WIDTH, STONE_HEIGHT,
      { topSpace: 78, bottomSpace: 9 });
    paintBoard(ctx, this.width / dpr, this.height / dpr, dpr,
      'Stonefall', this.state.gameOver ? 'The stack reached the top' : 'Clear complete rows', rect);
    ctx.save();
    ctx.scale(dpr, dpr);
    for (let y = 0; y < STONE_HEIGHT; y++) for (let x = 0; x < STONE_WIDTH; x++) {
      const value = this.state.grid[y * STONE_WIDTH + x];
      drawCell(ctx, rect, x, y, value === 1 ? '#279B9A' : value === 2 ? '#DF9C58' : '#FDFBF1', '#BCD1C7', 4);
    }
    if (!this.state.gameOver) {
      for (const [dx, dy] of shapeCells(this.state.active.type, this.state.active.rotation)) {
        const x = this.state.active.x + dx, y = this.state.active.y + dy;
        drawCell(ctx, rect, x, y, this.state.active.type === 'I' ? COLORS.teal : COLORS.coral, '#476B70', 4);
      }
    }
    ctx.restore();
  }
  getEntityCount() { return this.state.grid.filter(Boolean).length + (this.state.gameOver ? 0 : 3); }
  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer && this.controlClick) this.controlsContainer.removeEventListener?.('click', this.controlClick);
  }
}
