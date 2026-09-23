import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';
import { ANSWERS, applyWordInput, createWordState, restoreDaily, wordForDate } from './logic.js';

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const COLORS = { correct: '#167E83', present: '#D99B44', absent: '#647981' };

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function introComplete() {
  try { return localStorage.getItem('pliny:oracle:intro') === '1'; }
  catch { return false; }
}

function dailyState(dateKey) {
  const answer = wordForDate(dateKey);
  try { return restoreDaily(answer, localStorage.getItem(`pliny:oracle:daily:${dateKey}`)); }
  catch { return createWordState(answer); }
}

export class OracleWordsEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = 1;
    this.mode = introComplete() ? 'daily' : 'intro';
    this.dailyDate = todayKey();
    this.round = this.mode === 'intro' ? createWordState('WATER') : dailyState(this.dailyDate);
    this.hintShown = false;
    this.mountControls();
    attachTouchBridge(this, canvas);
  }

  uiScale() { return Math.max(1, this.dpr || 1); }
  resize(width, height, dpr) { this.width = width; this.height = height; this.dpr = dpr || 1; }
  update() {}
  onKeyDown(key, event) {
    if (event?.ctrlKey || event?.metaKey || event?.altKey) return;
    if (!/^[a-z]$/i.test(key) && key !== 'Enter' && key !== 'Backspace') return;
    event?.preventDefault?.();
    this.enterKey(key);
  }
  enterKey(key) {
    const next = applyWordInput(this.round, key);
    if (next === this.round) return;
    this.round = next;
    if (this.mode === 'daily') {
      try {
        localStorage.setItem(`pliny:oracle:daily:${this.dailyDate}`,
          JSON.stringify({ rows: next.rows.map(row => ({ guess: row.guess })), draft: next.draft }));
      } catch {}
    }
    if (this.mode === 'intro' && next.status === 'won') {
      try { localStorage.setItem('pliny:oracle:intro', '1'); } catch {}
    }
    this.refreshControls();
  }
  startMode(mode) {
    this.mode = mode;
    if (mode === 'intro') this.round = createWordState('WATER');
    else if (mode === 'daily') this.round = dailyState(this.dailyDate);
    else this.round = createWordState(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
    this.hintShown = false;
    this.refreshControls();
  }
  mountControls() {
    if (!this.controlsContainer) return;
    const rows = KEY_ROWS.map(row => `<div class="puzzle-key-row">${[...row].map(letter =>
      `<button type="button" class="puzzle-key" data-key="${letter}" aria-label="${letter}">${letter}</button>`
    ).join('')}</div>`).join('');
    this.controlsContainer.innerHTML = `
      <section class="puzzle-controls oracle-controls" aria-label="Oracle Words controls">
        <p class="puzzle-goal">Find the hidden five-letter word in six guesses.</p>
        <p class="puzzle-clue"></p>
        <p class="puzzle-rule">Teal: right place. Gold: elsewhere. Gray: not in the word.</p>
        <div class="puzzle-keyboard" aria-label="Letter keyboard">
          ${rows}
          <div class="puzzle-key-row">
            <button type="button" class="puzzle-key puzzle-key-wide" data-key="Enter">Enter</button>
            <button type="button" class="puzzle-key puzzle-key-wide" data-key="Backspace">Delete</button>
          </div>
        </div>
        <p class="puzzle-status" role="status" aria-live="polite"></p>
        <div class="puzzle-actions">
          <button type="button" data-action="hint">Hint</button>
          <button type="button" data-action="retry">Retry</button>
          <button type="button" data-action="next">Next word</button>
          <button type="button" data-action="daily">Today's word</button>
        </div>
      </section>`;
    this.controlClick = event => {
      const key = event.target.closest?.('[data-key]')?.dataset.key;
      if (key) { this.enterKey(key); return; }
      const action = event.target.closest?.('[data-action]')?.dataset.action;
      if (action === 'retry' && this.mode !== 'daily') {
        this.round = createWordState(this.round.answer);
        this.hintShown = false;
        this.refreshControls();
      }
      else if (action === 'daily') this.startMode('daily');
      else if (action === 'next') this.startMode(this.mode === 'intro' ? 'daily' : 'endless');
      else if (action === 'hint') { this.hintShown = true; this.refreshControls(); }
    };
    this.controlsContainer.addEventListener?.('click', this.controlClick);
    this.refreshControls();
  }
  refreshControls() {
    if (!this.controlsContainer?.querySelector) return;
    const clue = this.controlsContainer.querySelector('.puzzle-clue');
    const status = this.controlsContainer.querySelector('.puzzle-status');
    if (clue) clue.textContent = this.mode === 'intro' ? 'First word clue: what fills a canal?' :
      this.mode === 'daily' ? `Daily word for ${this.dailyDate}` : 'Unlimited play';
    if (status) status.textContent = this.round.message ||
      (this.hintShown ? `The word starts with ${this.round.answer[0]}.` :
        this.round.status === 'playing' ? `${6 - this.round.rows.length} guesses left.` : '');
    const marks = new Map();
    const priority = { absent: 1, present: 2, correct: 3 };
    for (const row of this.round.rows) {
      [...row.guess].forEach((letter, index) => {
        const mark = row.marks[index];
        if ((priority[mark] || 0) > (priority[marks.get(letter)] || 0)) marks.set(letter, mark);
      });
    }
    for (const button of this.controlsContainer.querySelectorAll?.('[data-key]') || []) {
      button.dataset.mark = marks.get(button.dataset.key) || '';
    }
    const retry = this.controlsContainer.querySelector?.('[data-action="retry"]');
    if (retry) retry.disabled = this.mode === 'daily';
  }
  render(ctx) {
    const dpr = this.uiScale();
    const width = this.width / dpr;
    const height = this.height / dpr;
    const playWidth = width >= 769 || (width >= 650 && height <= 500) ? width - 350 : width;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#F2EBD9';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1F4850';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.min(30, Math.max(20, width / 18))}px system-ui`;
    ctx.fillText('Oracle Words', playWidth / 2, 29);

    const gap = Math.max(3, Math.min(7, width / 75));
    const cell = Math.max(18, Math.min(61, (playWidth - 34 - 4 * gap) / 5, (height - 95 - 5 * gap) / 6));
    const boardWidth = cell * 5 + gap * 4;
    const boardHeight = cell * 6 + gap * 5;
    const left = (playWidth - boardWidth) / 2;
    const top = Math.max(47, (height - boardHeight) / 2 + 13);
    ctx.font = `700 ${Math.max(14, cell * 0.48)}px system-ui`;
    for (let row = 0; row < 6; row++) {
      const played = this.round.rows[row];
      const letters = played?.guess || (row === this.round.rows.length ? this.round.draft : '');
      for (let col = 0; col < 5; col++) {
        const x = left + col * (cell + gap);
        const y = top + row * (cell + gap);
        const mark = played?.marks[col];
        ctx.fillStyle = mark ? COLORS[mark] : '#FFFCF2';
        ctx.strokeStyle = mark ? COLORS[mark] : '#A7BDB6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, cell, cell, Math.min(7, cell / 6));
        ctx.fill();
        ctx.stroke();
        if (letters[col]) {
          ctx.fillStyle = mark ? '#FFFFFF' : '#1F4850';
          ctx.fillText(letters[col], x + cell / 2, y + cell / 2 + 1);
        }
      }
    }

    ctx.font = '600 13px system-ui';
    ctx.fillStyle = '#315660';
    const footer = this.round.status === 'won' ? 'Solved. Choose Next word to keep playing.' :
      this.round.status === 'lost' ? `The word was ${this.round.answer}. Try again.` :
        'Type or tap letters, then press Enter.';
    ctx.fillText(footer, playWidth / 2, Math.min(height - 17, top + boardHeight + 21));
    ctx.restore();
  }
  getEntityCount() { return 30; }
  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer && this.controlClick) {
      this.controlsContainer.removeEventListener?.('click', this.controlClick);
    }
  }
}
