import { CONFIG } from './config.js';
import { $, $$, fmtTime, fmtDay, now } from './util.js';
import { haEnabled, state } from './ha.js';
import home from './pages/home.js';
import calendar from './pages/calendar.js';
import lists from './pages/lists.js';
import meals from './pages/meals.js';
import energy from './pages/energy.js';
import ai from './pages/ai.js';
import commute from './pages/commute.js';
import weather from './pages/weather.js';
import bins from './pages/bins.js';
import ev from './pages/ev.js';
import recipes from './pages/recipes.js';
import doodle from './pages/doodle.js';

const ALL = [home, calendar, lists, meals, energy, ai, commute, weather, bins, ev, recipes, doodle];
const track = $('#track');
const tabs = $('#tabs');
let pages = [];
let current = 'home';
let lastTouch = Date.now();
let visibleKey = '';

// ---------- Pages and tabs ----------
function build() {
  pages = ALL.filter((p) => !p.visible || p.visible());
  visibleKey = pages.map((p) => p.id).join();
  track.innerHTML = ''; tabs.innerHTML = '';
  for (const p of pages) {
    const el = document.createElement('div');
    el.className = 'page'; el.id = `page-${p.id}`; el.dataset.page = p.id;
    track.append(el);
    try { p.render(el); p.refresh?.(el)?.catch?.(console.error); } catch (e) { console.error(p.id, e); }
    const b = document.createElement('button');
    b.className = 'tab'; b.dataset.tab = p.id;
    b.innerHTML = `<span>${p.icon}</span><small>${p.label}</small>`;
    tabs.append(b);
  }
  if (!pages.find((p) => p.id === current)) current = 'home';
  go(current, false);
}

function el(id) { return $(`#page-${id}`); }

export function go(id, smooth = true) {
  const p = pages.find((x) => x.id === id);
  if (!p) return;
  track.scrollTo({ left: el(id).offsetLeft, behavior: smooth ? 'smooth' : 'instant' });
  setActive(id);
}

function setActive(id) {
  if (id === current && $('.tab.on')?.dataset.tab === id) return;
  current = id;
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === id));
  $(`.tab[data-tab="${id}"]`)?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  const p = pages.find((x) => x.id === id);
  p?.onShow?.(el(id));
  p?.refresh?.(el(id));
}

tabs.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) go(t.dataset.tab); });
// Cards with data-goto act as shortcuts to other pages.
track.addEventListener('click', (e) => {
  if (e.target.closest('button, input, select, a, form')) return;
  const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto);
});
let scrollT;
track.addEventListener('scroll', () => {
  clearTimeout(scrollT);
  scrollT = setTimeout(() => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (pages[i]) setActive(pages[i].id);
  }, 80);
});
addEventListener('resize', () => go(current, false));

// ---------- Modes: morning, daytime, evening, night ----------
function modeAt(t) {
  const hr = t.getHours();
  for (const [name, m] of Object.entries(CONFIG.modes)) {
    const inRange = m.from < m.to ? hr >= m.from && hr < m.to : hr >= m.from || hr < m.to;
    if (inRange) return name;
  }
  return 'daytime';
}

const overlay = $('#overlay');
let overlayKind = null; // 'night' | 'slideshow'
let slides = []; let slideI = 0;

fetch('photos/photos.json').then((r) => r.json()).then((j) => { slides = j; }).catch(() => {});

function showOverlay(kind) {
  if (overlayKind === kind) return;
  overlayKind = kind;
  overlay.className = `overlay ${kind}`;
  overlay.hidden = false;
}
function hideOverlay() { overlayKind = null; overlay.hidden = true; }

let rendered = '';
function renderOverlay() {
  if (!overlayKind) { rendered = ''; return; }
  const t = now();
  if (slides.length) slideI = Math.floor(Date.now() / 20e3) % slides.length; // new photo every 20 s
  const key = overlayKind + slideI;
  if (key !== rendered) {
    rendered = key;
    const bg = overlayKind === 'slideshow' && slides.length
      ? `<div class="slide" style="background-image:url('photos/${encodeURI(slides[slideI])}')"></div>` : '';
    overlay.innerHTML = `${bg}<div class="ov-text"><div class="ov-clock"></div><div class="ov-date"></div></div>`;
  }
  overlay.querySelector('.ov-clock').textContent = fmtTime(t);
  overlay.querySelector('.ov-date').textContent = fmtDay(t);
}

function wake() {
  lastTouch = Date.now();
  if (overlayKind) hideOverlay();
  document.body.classList.remove('dim');
}
['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, wake, { capture: true }));
overlay.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); wake(); });

let lastMode = null;
async function tick() {
  const t = now();
  const page = pages.find((p) => p.id === current);
  page?.tick?.(el(current));
  // Keep recipe timers ticking even when on another page
  if (current !== 'recipes') recipes.tick?.(el('recipes'));
  renderOverlay();

  // Commute tab appears or disappears at midnight
  if (ALL.filter((p) => !p.visible || p.visible()).map((p) => p.id).join() !== visibleKey) build();

  const mode = modeAt(t);
  document.body.dataset.mode = mode;
  const idleMin = (Date.now() - lastTouch) / 60e3;
  if (mode !== lastMode) { lastMode = mode; if (CONFIG.modes[mode].page) go(CONFIG.modes[mode].page); }

  if (mode === 'night' && idleMin > 1) showOverlay('night');
  else if (mode === 'daytime' && idleMin > CONFIG.modes.daytime.slideshowAfterIdleMin) showOverlay('slideshow');
  else if (overlayKind && !(mode === 'night' || mode === 'daytime')) hideOverlay();

  if (!overlayKind && idleMin > CONFIG.idleReturnMin && CONFIG.modes[mode].page && current !== CONFIG.modes[mode].page) {
    go(CONFIG.modes[mode].page);
  }
}
setInterval(tick, 1000);

// Refresh data on the visible page every minute, everything every 15 minutes
setInterval(() => pages.find((p) => p.id === current)?.refresh?.(el(current)), 60e3);
setInterval(() => pages.forEach((p) => p.refresh?.(el(p.id))), 15 * 60e3);

// Wake on presence: an HA motion/occupancy binary_sensor near the display
if (haEnabled() && CONFIG.homeAssistant.entities.presence) {
  setInterval(async () => {
    const s = await state(CONFIG.homeAssistant.entities.presence);
    // Not at night: the dim clock stays until someone touches the screen
    if (s && s.state === 'on' && modeAt(now()) !== 'night') wake();
  }, 5000);
}

build();
tick();
window.hd = { go };
