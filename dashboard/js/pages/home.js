import { CONFIG } from '../config.js';
import { h, esc, fmtTime, fmtDay, fmtShort, now, sameDay } from '../util.js';
import { getWeather, describe } from '../weather.js';
import { getEvents, getList, personColour, nextCollection, LIDS, binReminderActive, getNotes, saveNotes, getMeals } from '../data.js';
import { uid } from '../store.js';

export default {
  id: 'home', label: 'Home', icon: '🏠',
  render(root) {
    root.innerHTML = `
      <div class="grid home-grid">
        <section class="card clock-card">
          <div class="big-clock" data-clock></div>
          <div class="date" data-date></div>
          <div class="weather-now" data-weather>Loading weather…</div>
        </section>
        <section class="card events-card" data-goto="calendar"><h2>Next up</h2><ul class="events" data-events></ul></section>
        <section class="card shop-card" data-goto="lists"><h2>Shopping list</h2><ul class="mini-list" data-shop></ul></section>
        <section class="card notes-card">
          <h2>Notes for each other</h2>
          <ul class="notes" data-notes></ul>
          <form class="row" data-note-form>
            <select data-from>${CONFIG.people.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
            <input data-note placeholder="Leave a note…" maxlength="140" />
            <button class="btn">Add</button>
          </form>
        </section>
        <section class="card strip" data-strip></section>
      </div>`;
    root.querySelector('[data-note-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = root.querySelector('[data-note]');
      if (!input.value.trim()) return;
      saveNotes([{ id: uid(), from: root.querySelector('[data-from]').value, text: input.value.trim(), at: Date.now() }, ...getNotes()].slice(0, 6));
      input.value = '';
      this.refresh(root);
    });
    root.querySelector('[data-notes]').addEventListener('click', (e) => {
      const id = e.target.closest('[data-del]')?.dataset.del;
      if (id) { saveNotes(getNotes().filter((n) => n.id !== id)); this.refresh(root); }
    });
  },
  tick(root) {
    const t = now();
    root.querySelector('[data-clock]').textContent = fmtTime(t);
    root.querySelector('[data-date]').textContent = fmtDay(t);
  },
  async refresh(root) {
    this.tick(root);
    const t = now();

    const w = await getWeather();
    if (w) {
      const [txt, ico] = describe(w.current.weather_code);
      root.querySelector('[data-weather]').innerHTML = `
        <span class="wx-ico">${ico}</span><span class="wx-temp">${Math.round(w.current.temperature_2m)}°</span>
        <span>${txt}<br><small>${Math.round(w.daily.temperature_2m_min[0])}° / ${Math.round(w.daily.temperature_2m_max[0])}° · rain ${w.daily.precipitation_probability_max[0]}%</small></span>`;
    } else root.querySelector('[data-weather]').textContent = 'Weather unavailable';

    const evs = (await getEvents(7)).filter((e) => e.end > t).slice(0, 4);
    root.querySelector('[data-events]').innerHTML = evs.map((e) => `
      <li><span class="dot" style="background:${personColour(e.person)}"></span>
      <span class="when">${sameDay(e.start, t) ? 'Today' : fmtShort(e.start)} ${e.allDay ? '' : fmtTime(e.start)}</span>
      <span>${esc(e.title)}</span></li>`).join('') || '<li class="muted">Nothing coming up</li>';

    const shop = (await getList('groceries')).filter((i) => !i.done);
    root.querySelector('[data-shop]').innerHTML = shop.slice(0, 6).map((i) => `<li>${esc(i.text)}</li>`).join('')
      + (shop.length > 6 ? `<li class="muted">+${shop.length - 6} more</li>` : '') || '<li class="muted">All done</li>';

    root.querySelector('[data-notes]').innerHTML = getNotes().map((n) => {
      const p = CONFIG.people.find((x) => x.id === n.from);
      return `<li style="border-color:${p?.colour}"><b>${esc(p?.name)}</b> ${esc(n.text)}
        <button class="x" data-del="${n.id}" aria-label="Remove">×</button></li>`;
    }).join('') || '<li class="muted">No notes</li>';

    const bin = nextCollection(t);
    const meal = getMeals()[t.getDay()];
    root.querySelector('[data-strip]').innerHTML = `
      <div data-goto="bins" class="${binReminderActive(t) ? 'alert' : ''}">
        ${bin.lids.map((l) => `<span class="lid" style="background:${LIDS[l].colour}"></span>`).join('')}
        ${binReminderActive(t) ? '<b>Bins out tonight</b>' : `Bins ${fmtShort(bin.date)}`}: ${bin.lids.map((l) => LIDS[l].label).join(' + ')}
      </div>
      <div data-goto="meals">🍽️ Tonight: <b>${esc(meal || 'not planned')}</b></div>`;
  },
};
