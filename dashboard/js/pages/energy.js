import { CONFIG } from '../config.js';
import { esc } from '../util.js';
import { haEnabled, num, state, service } from '../ha.js';

const E = CONFIG.homeAssistant.entities;
const tile = (label, value, unit, sub = '') => `
  <section class="card stat"><h2>${label}</h2><div class="stat-v">${value ?? '–'}<small>${unit}</small></div><div class="muted small">${sub}</div></section>`;

export default {
  id: 'energy', label: 'House', icon: '⚡',
  render(root) {
    root.innerHTML = `<div class="page-head"><h1>House and energy</h1></div>
      <div class="grid cols-4" data-stats></div>
      <section class="card"><h2>Lights</h2><div class="chips" data-lights></div></section>
      ${haEnabled() ? '' : '<p class="muted small">Demo values. Set Home Assistant url, token and entities in config.js.</p>'}`;
    root.querySelector('[data-lights]').addEventListener('click', async (e) => {
      const id = e.target.closest('[data-light]')?.dataset.light;
      if (id) { await service('light', 'toggle', { entity_id: id }); this.refresh(root); }
    });
  },
  async refresh(root) {
    const live = haEnabled();
    const [evW, evKwh, solar, grid, temp] = live
      ? await Promise.all([num(E.evPlugPower), num(E.evPlugEnergy), num(E.solarPower), num(E.gridPower), num(E.indoorTemp)])
      : [1840, 412.6, null, 2100, 21.5];
    root.querySelector('[data-stats]').innerHTML =
      tile('EV charging', evW == null ? null : (evW / 1000).toFixed(1), 'kW', evW > 50 ? 'Charging now' : 'Idle')
      + tile('EV energy total', evKwh?.toFixed(1), 'kWh', evKwh ? `≈ ${(evKwh * CONFIG.tariff.perKwh).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })} at $${CONFIG.tariff.perKwh}/kWh` : '')
      + tile('Solar', solar == null ? null : (solar / 1000).toFixed(1), 'kW', E.solarPower ? '' : 'Not set up')
      + tile('Grid', grid == null ? null : (grid / 1000).toFixed(1), 'kW', grid < 0 ? 'Exporting' : 'Importing')
      + tile('Inside', temp?.toFixed(1), '°C');

    const lights = live
      ? await Promise.all(E.lights.map(async (id) => ({ id, s: await state(id) })))
      : [{ id: 'demo.lounge', s: { state: 'on', attributes: { friendly_name: 'Lounge' } } }, { id: 'demo.kitchen', s: { state: 'off', attributes: { friendly_name: 'Kitchen' } } }];
    root.querySelector('[data-lights]').innerHTML = lights.map(({ id, s }) => `
      <button class="chip ${s?.state === 'on' ? 'on' : ''}" data-light="${esc(id)}">💡 ${esc(s?.attributes?.friendly_name ?? id)}</button>`).join('')
      || '<span class="muted">No lights configured</span>';
  },
};
