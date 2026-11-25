import { fmtDay, fmtShort, now, addDays } from '../util.js';
import { nextCollection, binReminderActive, LIDS } from '../data.js';

const bin = (lid) => `<div class="bin"><div class="bin-lid" style="background:${LIDS[lid].colour}"></div>
  <div class="bin-body"></div><span>${LIDS[lid].label}</span></div>`;

export default {
  id: 'bins', label: 'Bins',
  render(root) {
    root.innerHTML = `<div class="page-head"><h1>Bin day</h1></div>
      <section class="card bin-next"><div data-banner></div><div class="bins" data-bins></div></section>
      <section class="card"><h2>Coming up</h2><ul class="bin-upcoming" data-upcoming></ul></section>`;
  },
  refresh(root) {
    const t = now();
    const next = nextCollection(t);
    root.querySelector('[data-banner]').innerHTML = binReminderActive(t)
      ? '<h2 class="alert-text">Put the bins out tonight</h2>'
      : `<h2>Next collection: ${fmtDay(next.date)}</h2>`;
    root.querySelector('[data-bins]').innerHTML = next.lids.map(bin).join('');
    root.querySelector('[data-upcoming]').innerHTML = [1, 2, 3, 4].map((w) => {
      const c = nextCollection(addDays(next.date, 7 * w));
      return `<li><b>${fmtShort(c.date)}</b>${c.lids.map((l) => `<span class="lid" style="background:${LIDS[l].colour}"></span>${LIDS[l].label}`).join(' ')}</li>`;
    }).join('');
  },
};
