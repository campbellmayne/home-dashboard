// Thin line icons (24×24, stroke = currentColor). icon('home') returns an <svg> string.
const P = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  lists: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5"/><circle cx="5.2" cy="18" r="1.4"/>',
  meals: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 005 0V3M7 11v10"/><path d="M17 21V3c-2.5 1.5-3.5 4-3.5 8h3.5"/>',
  energy: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  commute: '<path d="M5 16.5V12l2-5h10l2 5v4.5"/><path d="M3.5 12h17v4.5h-17z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/>',
  weather: '<path d="M7 17.5a4 4 0 01-.4-8A5.5 5.5 0 0117.3 8.6 4.5 4.5 0 0117 17.5z"/><path d="M9 20.5l-.8 1.5M13 20.5l-.8 1.5"/>',
  bins: '<path d="M4 6.5h16M9.5 6.5V4h5v2.5"/><path d="M6 6.5l1 14h10l1-14"/><path d="M10 10.5v6M14 10.5v6"/>',
  ev: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/><path d="M11.5 9l-2 3.5h3l-2 3"/>',
  recipes: '<path d="M12 6.5c-2-1.5-5-2-8.5-1.5v14c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5z"/><path d="M12 6.5v14"/>',
  doodle: '<path d="M15.5 4.5l4 4L9 19H5v-4z"/><path d="M13.5 6.5l4 4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  // weather conditions
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  partly: '<path d="M8.5 6.5a3.5 3.5 0 015.9 1.4"/><path d="M8.5 2.5v1.2M3.8 7.5H5M5.2 4.2l.8.8"/><path d="M8 19.5a3.5 3.5 0 01-.3-7 5 5 0 019.6-.9A4 4 0 0117 19.5z"/>',
  cloud: '<path d="M7 18.5a4 4 0 01-.4-8A5.5 5.5 0 0117.3 9.6 4.5 4.5 0 0117 18.5z"/>',
  rain: '<path d="M7 15.5a4 4 0 01-.4-8A5.5 5.5 0 0117.3 6.6 4.5 4.5 0 0117 15.5z"/><path d="M8 18.5l-1 2.5M12 18.5l-1 2.5M16 18.5l-1 2.5"/>',
  storm: '<path d="M7 15.5a4 4 0 01-.4-8A5.5 5.5 0 0117.3 6.6 4.5 4.5 0 0117 15.5z"/><path d="M12.5 13.5l-2 4h3l-2 4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z"/>',
  fog: '<path d="M4 9h16M3 13h18M5 17h14"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? ''}</svg>`;
}
