import { CONFIG } from '../config.js';
import { esc, fmtTime, now, addDays, startOfDay, sameDay } from '../util.js';
import { getEvents, personColour } from '../data.js';
import { haEnabled } from '../ha.js';

export default {
  id: 'calendar', label: 'Calendar', icon: '📅',
  render(root) {
    root.innerHTML = `
      <div class="page-head"><h1>This week</h1>
        <div class="legend">${CONFIG.people.map((p) => `<span><i style="background:${p.colour}"></i>${esc(p.name)}</span>`).join('')}
        <span><i style="background:${personColour('both')}"></i>Both</span></div></div>
      <div class="week" data-week></div>
      ${haEnabled() ? '' : '<p class="muted small">Demo events. Connect Google or iCloud calendars in Home Assistant, then list them in config.js.</p>'}`;
  },
  async refresh(root) {
    const t = now();
    const evs = await getEvents(7);
    const d0 = startOfDay(t);
    root.querySelector('[data-week]').innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(d0, i);
      const dayEvs = evs.filter((e) => sameDay(e.start, d));
      return `<div class="day ${i === 0 ? 'today' : ''}">
        <div class="day-head">${d.toLocaleDateString('en-AU', { weekday: 'short' })} <b>${d.getDate()}</b></div>
        ${dayEvs.map((e) => `<div class="ev" style="--c:${personColour(e.person)}">
          <small>${e.allDay ? 'All day' : fmtTime(e.start)}</small>${esc(e.title)}</div>`).join('')}
      </div>`;
    }).join('');
  },
};
