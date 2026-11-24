import { CONFIG } from '../config.js';
import { aud } from '../util.js';
import { haEnabled, num } from '../ha.js';
import { load, save } from '../store.js';

const E = CONFIG.homeAssistant.entities;

export default {
  id: 'ev', label: 'EV', icon: '🔋',
  render(root) {
    root.innerHTML = `<div class="page-head"><h1>${CONFIG.ev.model}</h1></div>
      <div class="grid ev-grid">
        <section class="card battery-card"><div class="battery"><div class="battery-fill" data-fill></div><span data-pct></span></div>
          <div class="muted" data-range></div><div data-warn></div></section>
        <section class="card stat"><h2>Charging</h2><div class="stat-v" data-power></div><div class="muted small" data-status></div></section>
        <section class="card stat"><h2>Last charge</h2><div class="stat-v" data-last></div><div class="muted small" data-lastkwh></div></section>
      </div>
      ${haEnabled() ? '' : '<p class="muted small">Demo values. Car data via hass-byd-vehicle or WiCAN Pro, charge energy via Shelly Plug S.</p>'}`;
  },
  async refresh(root) {
    const live = haEnabled();
    const [pct, range, watts, kwhTotal] = live
      ? await Promise.all([num(E.evBattery), num(E.evRange), num(E.evPlugPower), num(E.evPlugEnergy)])
      : [24, 98, 0, 412.6];

    // Track charge sessions from the plug's energy counter: a session ends when power drops to ~0.
    const s = load('evSession', { start: null, last: null });
    if (watts > 50 && s.start == null && kwhTotal != null) s.start = kwhTotal;
    if (watts != null && watts <= 50 && s.start != null && kwhTotal != null) {
      s.last = { kwh: kwhTotal - s.start, at: Date.now() }; s.start = null;
    }
    save('evSession', s);
    const last = s.last ?? (live ? null : { kwh: 18.4, at: Date.now() - 2 * 864e5 });

    const low = pct != null && pct < CONFIG.ev.lowPercent;
    const fill = root.querySelector('[data-fill]');
    fill.style.width = `${pct ?? 0}%`;
    fill.classList.toggle('low', low);
    root.querySelector('[data-pct]').textContent = pct == null ? '–' : `${Math.round(pct)}%`;
    root.querySelector('[data-range]').textContent = range == null ? '' : `${Math.round(range)} km range`;
    root.querySelector('[data-warn]').innerHTML = low && !(watts > 50) ? '<div class="alert-text">🔌 Battery low, plug in tonight</div>' : '';
    root.querySelector('[data-power]').innerHTML = watts == null ? '–' : `${(watts / 1000).toFixed(1)}<small>kW</small>`;
    root.querySelector('[data-status]').textContent = watts > 50 ? 'Charging' : 'Not charging';
    root.querySelector('[data-last]').textContent = last ? aud(last.kwh * CONFIG.tariff.perKwh) : '–';
    root.querySelector('[data-lastkwh]').textContent = last ? `${last.kwh.toFixed(1)} kWh · ${new Date(last.at).toLocaleDateString('en-AU')}` : '';
  },
};
