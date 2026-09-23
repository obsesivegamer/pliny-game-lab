// Showcase homepage: floor plan, pavilion index, game cards and filtering.
// Everything is derived from DEMOS and PAVILIONS, so adding a game or a
// pavilion to the catalog needs no markup changes here or in index.html.

import { soundMaster } from "./sound.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const ROMAN = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

function toRoman(n) {
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}

// "III. Mechanica & Machina (Roman Engineering)" -> numeral, title, gloss
function parsePavilion(pav, index) {
  const m = pav.name.match(/^([IVXLC]+)\.\s*([^(]+?)\s*(?:\((.*)\))?$/);
  return {
    id: pav.id,
    numeral: m ? m[1] : toRoman(index + 1),
    title: m ? m[2] : pav.name,
    gloss: m && m[3] ? m[3] : "",
    index
  };
}

// "Vesuvius (Volcanology Sim)" -> { title: "Vesuvius", sub: "Volcanology Sim" }
function splitName(name) {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { title: m[1], sub: m[2] } : { title: name, sub: "" };
}

// Groups games by pavilion. Room numbers follow architectural convention:
// pavilion III, second game -> room 302.
export function buildCatalog(demos, pavilions) {
  const keys = Object.keys(demos);
  return pavilions.map((pav, i) => {
    const meta = parsePavilion(pav, i);
    const games = keys
      .filter(key => demos[key].pavilionId === pav.id)
      .map((key, j) => ({
        key,
        demo: demos[key],
        ...splitName(demos[key].name),
        room: (i + 1) * 100 + j + 1,
        overall: keys.indexOf(key) + 1
      }));
    return { ...meta, games };
  }).filter(group => group.games.length > 0);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg(tag, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------ cards */

function thumbFor(game, wrap) {
  const img = el("img", "card-thumb");
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  const fallback = `assets/screenshots/${String(game.overall).padStart(2, "0")}_${game.key}.png`;
  img.addEventListener("error", () => {
    if (img.dataset.fallback) {
      wrap.classList.add("no-thumb");
      img.remove();
      return;
    }
    img.dataset.fallback = "1";
    img.src = fallback;
  });
  img.src = `assets/thumbs/${game.key}.webp`;
  return img;
}

function buildCard(hub, group, game) {
  const card = el("a", "engine-card");
  card.href = `#game=${game.key}`;
  card.dataset.key = game.key;
  card.dataset.pavilion = group.id;
  card.dataset.search = [
    game.demo.name, group.numeral, group.title, group.gloss,
    game.demo.desc, game.demo.hint, game.room
  ].join(" ").toLowerCase();

  const wrap = el("span", "card-thumb-wrap");
  wrap.appendChild(thumbFor(game, wrap));
  const pending = el("span", "thumb-pending", "Drawing pending");
  wrap.appendChild(pending);

  const meta = el("span", "card-meta");
  meta.appendChild(el("span", "card-room", String(game.room)));
  const text = el("span", "card-text");
  text.appendChild(el("h3", "card-title", game.title));
  if (game.sub) text.appendChild(el("span", "card-sub", game.sub));
  text.appendChild(el("span", "card-desc", game.demo.desc));
  meta.appendChild(text);

  card.append(wrap, meta);
  card.addEventListener("mouseenter", () => soundMaster.playChime("A4", 0.05));
  card.addEventListener("click", (e) => {
    // Let modified clicks open the game in a new tab via its #game= link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    hub.launchDemo(game.key);
  });
  return card;
}

function buildGroup(hub, group) {
  const section = el("section", "pavilion-group");
  section.id = `pavilion-${group.id}`;
  section.dataset.pavilion = group.id;
  section.setAttribute("aria-labelledby", `pavilion-${group.id}-title`);

  const head = el("header", "group-head");
  head.appendChild(el("span", "group-num", group.numeral));
  const titles = el("div", "group-titles");
  const h2 = el("h2", "group-title", group.title);
  h2.id = `pavilion-${group.id}-title`;
  titles.appendChild(h2);
  if (group.gloss) titles.appendChild(el("p", "group-gloss", group.gloss));
  head.appendChild(titles);
  head.appendChild(el("span", "group-count", plural(group.games.length, "game")));

  const grid = el("div", "group-grid");
  group.games.forEach(game => grid.appendChild(buildCard(hub, group, game)));
  section.append(head, grid);
  return section;
}

function buildChip(hub, id, numeral, name, count) {
  const chip = el("button", "chip-btn");
  chip.type = "button";
  chip.dataset.pav = id;
  chip.setAttribute("aria-pressed", id === "all" ? "true" : "false");
  chip.append(
    el("span", "chip-num", numeral),
    el("span", "chip-name", name),
    el("span", "chip-count", String(count))
  );
  chip.addEventListener("mouseenter", () => soundMaster.playChime("E5", 0.08));
  chip.addEventListener("click", () => {
    soundMaster.playChime(id === "all" ? "A4" : "C5", 0.15);
    hub.selectPavilionFilter(id);
  });
  return chip;
}

/* ------------------------------------------------------------- floor plan */

// Splits [a, b] into n equal spans.
function spans(a, b, n) {
  const w = (b - a) / n;
  return Array.from({ length: n }, (_, i) => [a + i * w, a + (i + 1) * w]);
}

// Lays rooms clockwise around a central atrium, entered from the bottom
// through the fauces: top row left to right, east wing, bottom row right to
// left (split by the entrance), west wing.
function planRooms(n, box) {
  const { x0, y0, x1, y1, row, wing, fauces } = box;
  const side = n >= 4 ? 1 : 0;
  const rest = n - side * 2;
  const top = Math.ceil(rest / 2);
  const bottom = rest - top;
  const rooms = [];
  spans(x0, x1, top).forEach(([a, b]) => rooms.push({ x: a, y: y0, w: b - a, h: row, door: "bottom" }));
  if (side) rooms.push({ x: x1 - wing, y: y0 + row, w: wing, h: y1 - y0 - 2 * row, door: "left" });
  const mid = (x0 + x1) / 2;
  const east = Math.ceil(bottom / 2);
  const west = bottom - east;
  spans(mid + fauces / 2, x1, east).reverse()
    .forEach(([a, b]) => rooms.push({ x: a, y: y1 - row, w: b - a, h: row, door: "top" }));
  spans(x0, mid - fauces / 2, west).reverse()
    .forEach(([a, b]) => rooms.push({ x: a, y: y1 - row, w: b - a, h: row, door: "top" }));
  if (side) rooms.push({ x: x0, y: y0 + row, w: wing, h: y1 - y0 - 2 * row, door: "right" });
  return { rooms, atrium: { x: x0 + side * wing, y: y0 + row, w: x1 - x0 - 2 * side * wing, h: y1 - y0 - 2 * row } };
}

// A door opening on the wall facing the atrium, with its leaf and swing arc.
function drawDoor(g, room, cut) {
  const D = 22;
  const draw = { class: "plan-thin plan-draw", pathLength: 1 };
  let x, y, gap, leaf, arc;
  if (room.door === "bottom" || room.door === "top") {
    x = room.x + room.w * 0.28;
    y = room.door === "bottom" ? room.y + room.h : room.y;
    const s = room.door === "bottom" ? -1 : 1;
    gap = [x, y, x + D, y];
    leaf = [x, y, x, y + s * D];
    arc = `M${x} ${y + s * D}A${D} ${D} 0 0 ${s < 0 ? 1 : 0} ${x + D} ${y}`;
  } else {
    y = room.y + room.h * 0.3;
    x = room.door === "left" ? room.x : room.x + room.w;
    const s = room.door === "left" ? 1 : -1;
    gap = [x, y, x, y + D];
    leaf = [x, y, x + s * D, y];
    arc = `M${x + s * D} ${y}A${D} ${D} 0 0 ${s > 0 ? 1 : 0} ${x} ${y + D}`;
  }
  svg("line", { x1: gap[0], y1: gap[1], x2: gap[2], y2: gap[3], class: "plan-cut" }, cut);
  svg("line", { x1: leaf[0], y1: leaf[1], x2: leaf[2], y2: leaf[3], ...draw }, g);
  svg("path", { d: arc, ...draw, class: "plan-thin plan-swing plan-draw" }, g);
}

// One plinth per game, lined up against the wall opposite the door.
function drawPlinths(g, room, count) {
  const S = 9, GAP = 6, PAD = 14;
  const horizontal = room.door === "top" || room.door === "bottom";
  const span = (horizontal ? room.w : room.h) - PAD * 2;
  const perLine = Math.max(1, Math.floor((span + GAP) / (S + GAP)));
  for (let i = 0; i < count; i++) {
    const line = Math.floor(i / perLine);
    const inLine = Math.min(perLine, count - line * perLine);
    const pos = i % perLine;
    const offset = (span - (inLine * S + (inLine - 1) * GAP)) / 2;
    const along = PAD + offset + pos * (S + GAP);
    const depth = PAD + line * (S + GAP);
    let x, y;
    if (room.door === "bottom") { x = room.x + along; y = room.y + depth; }
    else if (room.door === "top") { x = room.x + along; y = room.y + room.h - depth - S; }
    else if (room.door === "left") { x = room.x + room.w - depth - S; y = room.y + along; }
    else { x = room.x + depth; y = room.y + along; }
    svg("rect", { x, y, width: S, height: S, class: "plan-plinth" }, g);
  }
}

function drawAtrium(plan, cut, atrium, fauces, bottomY) {
  const { x, y, w, h } = atrium;
  const inset = 16;
  svg("rect", { x: x + inset, y: y + inset, width: w - inset * 2, height: h - inset * 2, class: "plan-roofline" }, plan);
  const cols = Math.max(2, Math.round((w - inset * 2) / 44));
  const rows = Math.max(2, Math.round((h - inset * 2) / 44));
  for (let i = 0; i <= cols; i++) {
    const cx = x + inset + (i * (w - inset * 2)) / cols;
    svg("rect", { x: cx - 3, y: y + inset - 3, width: 6, height: 6, class: "plan-column" }, plan);
    svg("rect", { x: cx - 3, y: y + h - inset - 3, width: 6, height: 6, class: "plan-column" }, plan);
  }
  for (let j = 1; j < rows; j++) {
    const cy = y + inset + (j * (h - inset * 2)) / rows;
    svg("rect", { x: x + inset - 3, y: cy - 3, width: 6, height: 6, class: "plan-column" }, plan);
    svg("rect", { x: x + w - inset - 3, y: cy - 3, width: 6, height: 6, class: "plan-column" }, plan);
  }
  const iw = w * 0.34, ih = h * 0.34;
  svg("rect", { x: x + (w - iw) / 2, y: y + (h - ih) / 2 - 8, width: iw, height: ih, class: "plan-impluvium plan-draw", pathLength: 1 }, plan);
  const label = svg("text", { x: x + w / 2, y: y + (h + ih) / 2 + 10, class: "plan-label plan-label-quiet", "text-anchor": "middle" }, plan);
  label.textContent = "Atrium";

  // Fauces: the entrance passage through the south wall, and the way in.
  const mid = x + w / 2;
  svg("line", { x1: mid - fauces / 2, y1: bottomY, x2: mid + fauces / 2, y2: bottomY, class: "plan-cut plan-cut-wide" }, cut);
  svg("path", { d: `M${mid} ${bottomY + 16}V${y + h + 4}`, class: "plan-arrow" }, plan);
  svg("path", { d: `M${mid - 5} ${y + h + 12}L${mid} ${y + h + 3}L${mid + 5} ${y + h + 12}`, class: "plan-arrow-head" }, plan);
  const enter = svg("text", { x: mid, y: bottomY + 28, class: "plan-label plan-label-red", "text-anchor": "middle" }, plan);
  enter.textContent = "Enter";
}

function buildPlan(hub, svgEl, groups, legend) {
  const W = 600;
  const box = { x0: 12, y0: 30, x1: W - 12, y1: 404, row: 116, wing: 118, fauces: 56 };
  const { rooms, atrium } = planRooms(groups.length, box);

  svgEl.replaceChildren();
  const defs = svg("defs", {}, svgEl);
  const hatch = svg("pattern", { id: "plan-hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
  svg("line", { x1: 0, y1: 0, x2: 0, y2: 6, class: "plan-hatch-line" }, hatch);

  // Dimension line across the top of the sheet.
  const dim = svg("g", { class: "plan-dim" }, svgEl);
  svg("line", { x1: box.x0, y1: 14, x2: box.x1, y2: 14 }, dim);
  svg("line", { x1: box.x0, y1: 9, x2: box.x0, y2: 19 }, dim);
  svg("line", { x1: box.x1, y1: 9, x2: box.x1, y2: 19 }, dim);
  const dimLabel = svg("text", { x: W / 2, y: 10, "text-anchor": "middle", class: "plan-label plan-label-quiet" }, dim);
  dimLabel.textContent = `${plural(groups.length, "pavilion")} · ${plural(groups.reduce((n, g) => n + g.games.length, 0), "game")} · scale 1:100`;

  const outline = { x: box.x0, y: box.y0, width: box.x1 - box.x0, height: box.y1 - box.y0 };
  svg("rect", { ...outline, class: "plan-floor" }, svgEl);
  const plan = svg("g", {}, svgEl);
  // Door and entrance openings are painted in floor colour over the walls,
  // so this group is appended last, after the outer wall.
  const cut = svg("g", {});
  drawAtrium(plan, cut, atrium, box.fauces, box.y1);

  const setLegend = (group) => {
    const [mark, title, body] = legend.children;
    if (!group) {
      mark.textContent = "Ground floor";
      title.textContent = "Pick a room";
      body.textContent = `${plural(groups.length, "pavilion")} around one atrium, each shelving games on one theme. Choose a room to open its shelf in the index.`;
      return;
    }
    mark.textContent = `Pavilion ${group.numeral} · rooms ${group.games[0].room}–${group.games[group.games.length - 1].room}`;
    title.textContent = group.title;
    body.textContent = `${group.gloss ? group.gloss + ". " : ""}${group.games.map(g => g.title).join(", ")}.`;
  };
  setLegend(null);

  groups.forEach((group, i) => {
    const room = rooms[i];
    const link = svg("a", { href: `#pavilion-${group.id}`, class: "plan-room", "data-pav": group.id, style: `--i:${i}` }, plan);
    link.setAttribute("aria-label", `Pavilion ${group.numeral}, ${group.title}: ${plural(group.games.length, "game")}`);
    svg("rect", { x: room.x, y: room.y, width: room.w, height: room.h, class: "plan-room-fill" }, link);
    svg("rect", { x: room.x, y: room.y, width: room.w, height: room.h, class: "plan-wall plan-draw", pathLength: 1 }, link);
    drawDoor(link, room, cut);
    drawPlinths(link, room, group.games.length);

    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2 + (room.door === "bottom" ? 6 : room.door === "top" ? -4 : 0);
    const name = group.title.split(/\s*&\s*/)[0].toUpperCase();
    // Barlow Semi Condensed caps at 11px with 0.16em tracking run ~8.4px a glyph.
    const fits = name.length * 8.4 < room.w - 16;
    const label = svg("text", { x: cx, y: cy, "text-anchor": "middle", class: "plan-label plan-room-name" }, link);
    label.textContent = fits ? name : group.numeral;
    const meta = svg("text", { x: cx, y: cy + 14, "text-anchor": "middle", class: "plan-label plan-room-meta" }, link);
    meta.textContent = `${group.numeral} · ${plural(group.games.length, "game")}`;
    const big = svg("text", { x: cx, y: cy + 8, "text-anchor": "middle", class: "plan-room-numeral" }, link);
    big.textContent = group.numeral;

    const activate = () => {
      svgEl.querySelectorAll(".plan-room.is-active").forEach(r => r.classList.remove("is-active"));
      link.classList.add("is-active");
      setLegend(group);
    };
    const deactivate = () => {
      link.classList.remove("is-active");
      setLegend(null);
    };
    link.addEventListener("mouseenter", activate);
    link.addEventListener("focus", activate);
    link.addEventListener("mouseleave", deactivate);
    link.addEventListener("blur", deactivate);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      soundMaster.playChime("C5", 0.15);
      hub.selectPavilionFilter(group.id);
      scrollToIndex(hub);
    });
  });

  svg("rect", { ...outline, class: "plan-outer plan-draw", pathLength: 1 }, svgEl);
  svgEl.appendChild(cut);
}

function scrollToIndex(hub) {
  const bar = document.getElementById("showcase-bar");
  if (!bar || !hub.showcaseView) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = bar.getBoundingClientRect().top - hub.showcaseView.getBoundingClientRect().top + hub.showcaseView.scrollTop;
  hub.showcaseView.scrollTo({ top: top - 8, behavior: reduce ? "auto" : "smooth" });
}

/* ------------------------------------------------------------- public api */

export function renderShowcase(hub, demos, pavilions) {
  const groups = buildCatalog(demos, pavilions);
  hub.showcaseGroups = groups;
  hub.showcaseTotal = groups.reduce((n, g) => n + g.games.length, 0);

  document.querySelectorAll('[data-stat="games"]').forEach(n => { n.textContent = hub.showcaseTotal; });
  document.querySelectorAll('[data-stat="pavilions"]').forEach(n => { n.textContent = groups.length; });

  if (hub.showcaseChips) {
    hub.showcaseChips.replaceChildren(buildChip(hub, "all", "", "All games", hub.showcaseTotal));
    hub.showcaseChips.firstChild.classList.add("active");
    groups.forEach(g => hub.showcaseChips.appendChild(buildChip(hub, g.id, g.numeral, g.title, g.games.length)));
  }

  hub.showcaseGrid.replaceChildren(...groups.map(g => buildGroup(hub, g)));

  const planEl = document.getElementById("showcase-plan");
  const legend = document.getElementById("plan-legend");
  if (planEl && legend) buildPlan(hub, planEl, groups, legend);

  if (hub.showcaseSearch) {
    hub.showcaseSearch.placeholder = `Search ${hub.showcaseTotal} games`;
    hub.showcaseSearch.addEventListener("input", (e) => {
      hub.searchQuery = e.target.value.toLowerCase().trim();
      hub.filterShowcase();
    });
  }

  if (hub.clearSearchBtn) {
    hub.clearSearchBtn.addEventListener("click", () => {
      if (hub.showcaseSearch) hub.showcaseSearch.value = "";
      hub.searchQuery = "";
      hub.selectPavilionFilter("all");
    });
  }

  const keys = Object.keys(demos);
  if (hub.heroLaunchBtn) hub.heroLaunchBtn.dataset.launch = "vesuvius";
  document.querySelectorAll("[data-launch]").forEach(btn => {
    btn.addEventListener("click", () => hub.launchDemo(demos[btn.dataset.launch] ? btn.dataset.launch : keys[0]));
  });
  if (hub.heroRandomBtn) {
    hub.heroRandomBtn.addEventListener("click", () => {
      hub.launchDemo(keys[Math.floor(Math.random() * keys.length)]);
    });
  }
  document.querySelectorAll("[data-scroll-index]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToIndex(hub);
    });
  });
}

export function applyShowcaseFilter(hub) {
  if (!hub.showcaseGrid) return;
  let visible = 0;
  hub.showcaseGrid.querySelectorAll(".pavilion-group").forEach(section => {
    let inGroup = 0;
    section.querySelectorAll(".engine-card").forEach(card => {
      const show = (hub.activePavilionFilter === "all" || card.dataset.pavilion === hub.activePavilionFilter) &&
        (!hub.searchQuery || card.dataset.search.includes(hub.searchQuery));
      card.style.display = show ? "" : "none";
      if (show) inGroup++;
    });
    section.style.display = inGroup ? "" : "none";
    visible += inGroup;
  });

  const total = hub.showcaseTotal || 0;
  if (hub.showcaseCount) {
    hub.showcaseCount.textContent = visible === total ? `${plural(total, "game")}` : `${visible} of ${plural(total, "game")}`;
  }
  if (hub.showcaseChips) {
    hub.showcaseChips.querySelectorAll(".chip-btn").forEach(c => {
      const on = c.dataset.pav === hub.activePavilionFilter;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  if (hub.showcaseEmpty) {
    hub.showcaseEmpty.style.display = visible === 0 ? "block" : "none";
    const q = document.getElementById("empty-query");
    if (q) q.textContent = hub.searchQuery ? `“${hub.searchQuery}”` : "this filter";
  }
}

// Arrow-key movement through the visible cards, following the rendered grid
// rather than a fixed column count, so it holds at every breakpoint.
export function neighborCard(cards, current, key) {
  if (!current) return cards[0];
  const idx = cards.indexOf(current);
  if (key === "ArrowRight") return cards[(idx + 1) % cards.length];
  if (key === "ArrowLeft") return cards[(idx - 1 + cards.length) % cards.length];
  const from = current.getBoundingClientRect();
  const fromX = from.left + from.width / 2;
  const down = key === "ArrowDown";
  let best = null;
  let bestScore = Infinity;
  for (const card of cards) {
    if (card === current) continue;
    const r = card.getBoundingClientRect();
    const dy = down ? r.top - from.top : from.top - r.top;
    if (dy <= 1) continue;
    const score = dy * 4 + Math.abs(r.left + r.width / 2 - fromX);
    if (score < bestScore) { bestScore = score; best = card; }
  }
  return best || current;
}
