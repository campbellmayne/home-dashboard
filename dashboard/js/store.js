// Tiny persistent store. Uses localStorage on the display; falls back to memory.
const mem = {};
const listeners = new Set();

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem('hd:' + key);
    if (raw != null) return JSON.parse(raw);
  } catch {}
  return key in mem ? mem[key] : structuredClone(fallback);
}

export function save(key, value) {
  mem[key] = value;
  try { localStorage.setItem('hd:' + key, JSON.stringify(value)); } catch {}
  listeners.forEach((fn) => fn(key, value));
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const uid = () => Math.random().toString(36).slice(2, 10);
