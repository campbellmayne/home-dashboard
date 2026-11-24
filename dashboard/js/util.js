export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Uses the device's local time: set the Pi's timezone to Australia/Melbourne (see pi/setup.sh).
export const fmtTime = (d) => d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
export const fmtDay = (d) => d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = (d) => d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
export const aud = (n) => n == null ? '–' : n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

export function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function sameDay(a, b) { return startOfDay(a).getTime() === startOfDay(b).getTime(); }
export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function parseIsoDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

// Mutable clock so the app can be tested at any time via ?now=2026-11-25T18:00
const override = new URLSearchParams(location.search).get('now');
const offset = override ? new Date(override).getTime() - Date.now() : 0;
export const now = () => new Date(Date.now() + offset);
