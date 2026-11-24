import { CONFIG } from '../config.js';
import { fmtTime, now } from '../util.js';

const C = CONFIG.commute;

export default {
  id: 'commute', label: 'Commute', icon: '🚗',
  visible: () => C.days.includes(now().getDay()),
  render(root) {
    root.innerHTML = `<div class="page-head"><h1>Office day</h1></div>
      <div class="grid cols-3">
        <section class="card stat"><h2>Drive time</h2><div class="stat-v" data-drive></div><div class="muted small">Typical, until a traffic source is connected</div></section>
        <section class="card stat"><h2>Leave by</h2><div class="stat-v" data-leave></div><div class="muted small" data-arrive></div></section>
        <section class="card stat"><h2>Public transport</h2><a class="btn" href="${C.ptvLink}" target="_blank">PTV journey planner</a></section>
      </div>`;
  },
  refresh(root) {
    const [hh, mm] = C.officeArrive.split(':').map(Number);
    const arrive = now(); arrive.setHours(hh, mm, 0, 0);
    const leave = new Date(arrive - C.typicalMinutes * 60e3);
    root.querySelector('[data-drive]').innerHTML = `${C.typicalMinutes}<small>min</small>`;
    root.querySelector('[data-leave]').textContent = fmtTime(leave);
    root.querySelector('[data-arrive]').textContent = `to arrive ${fmtTime(arrive)}`;
  },
};
