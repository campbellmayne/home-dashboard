import { CONFIG } from '../config.js';
import { esc, fmtTime, fmtShort, now, sameDay, addDays, startOfDay } from '../util.js';
import { getWeather, describe, wxIcon } from '../weather.js';
import { scene, sceneKind, lightText } from '../scene.js';
import { icon } from '../icons.js';
import { haEnabled, num } from '../ha.js';
import { getEvents, getList, toggleItem, personColour, nextCollection, LIDS, binReminderActive, getNotes, saveNotes, getMeals } from '../data.js';
import { uid } from '../store.js';

const greeting = (h) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

// Smooth line through points (Catmull-Rom → cubic Bézier).
function smooth(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function hourlyCurve(w) {
  const idx = [0, 3, 6, 9, 12, 15].filter((i) => i < w.hourly.time.length);
  const temps = idx.map((i) => w.hourly.temperature_2m[i]);
  const lo = Math.min(...temps); const hi = Math.max(...temps); const span = Math.max(hi - lo, 4);
  const W = 600; const step = W / idx.length;
  const pts = idx.map((_, k) => [step * k + step / 2, 58 - ((temps[k] - lo) / span) * 40]);
  return `
    <svg class="curve" viewBox="0 0 ${W} 70" preserveAspectRatio="none"><path d="${smooth(pts)}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" opacity=".8"/></svg>
    <div class="curve-points">${idx.map((i, k) => `
      <div style="--y:${pts[k][1]}">
        <i></i><b>${Math.round(temps[k])}°</b>
        ${icon(wxIcon(w.hourly.weather_code[i], w.hourly.is_day?.[i] ?? 1))}
        <small>${k === 0 ? 'Now' : new Date(w.hourly.time[i]).toLocaleTimeString('en-AU', { hour: 'numeric' })}</small>
        <small class="rain">${w.hourly.precipitation_probability[i]}%</small>
      </div>`).join('')}</div>`;
}

export default {
  id: 'home', label: 'Home',
  render(root) {
    root.innerHTML = `
      <div class="home">
        <header class="home-head">
          <div class="clock-block">
            <div class="kicker" data-greet></div>
            <div class="big-clock" data-clock></div>
            <div class="date" data-date></div>
          </div>
          <div class="pills" data-pills></div>
        </header>
        <div class="home-cols">
          <section class="card wx-card" data-goto="weather" data-wx><div class="wx-body">Loading weather…</div></section>
          <div class="col">
            <section class="card events-card" data-goto="calendar">
              <div class="card-head"><h2>Next up</h2>${icon('calendar')}</div><ul class="events" data-events></ul></section>
            <section class="card shop-card">
              <div class="card-head"><h2>Shopping</h2><span class="count" data-shop-count></span></div><ul class="checks" data-shop></ul></section>
          </div>
          <div class="col">
            <section class="card photo-card meal-card" data-goto="meals" style="background-image:url(img/meal.jpg)">
              <div class="photo-text"><span class="kicker">Tonight</span><div class="serif-lg" data-meal></div></div></section>
            <section class="card bin-card" data-goto="bins" data-bins></section>
            <section class="card notes-card">
              <div class="card-head"><h2>Notes</h2></div>
              <ul class="notes" data-notes></ul>
              <form class="note-form" data-note-form>
                <select data-from aria-label="From">${CONFIG.people.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
                <input data-note placeholder="Leave a note…" maxlength="140" />
                <button class="icon-btn" aria-label="Add note">${icon('plus')}</button>
              </form>
            </section>
          </div>
        </div>
      </div>`;
    root.querySelector('[data-note-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = root.querySelector('[data-note]');
      if (!input.value.trim()) return;
      saveNotes([{ id: uid(), from: root.querySelector('[data-from]').value, text: input.value.trim(), at: Date.now() }, ...getNotes()].slice(0, 6));
      input.value = '';
      this.refresh(root);
    });
    root.addEventListener('click', async (e) => {
      const del = e.target.closest('[data-del]')?.dataset.del;
      if (del) { saveNotes(getNotes().filter((n) => n.id !== del)); this.refresh(root); return; }
      const li = e.target.closest('[data-shop-item]');
      if (li) {
        li.classList.add('done');
        await toggleItem('groceries', this.shop.find((i) => i.id === li.dataset.shopItem));
        setTimeout(() => this.refresh(root), 600);
      }
    });
  },
  shop: [],
  tick(root) {
    const t = now();
    root.querySelector('[data-clock]').textContent = fmtTime(t).replace(/\s?(am|pm)/i, '');
    root.querySelector('[data-date]').textContent = t.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
    root.querySelector('[data-greet]').textContent = greeting(t.getHours());
  },
  async refresh(root) {
    this.tick(root);
    const t = now();

    // Weather: illustrated scene + big temperature + chips + hourly curve
    const w = await getWeather();
    const wx = root.querySelector('[data-wx]');
    if (w) {
      const c = w.current;
      const kind = sceneKind(c.weather_code, c.is_day ?? 1);
      wx.classList.toggle('on-dark', lightText(kind));
      wx.innerHTML = `${scene(kind)}
        <div class="wx-body">
          <div class="kicker">${esc(CONFIG.location.name)}</div>
          <div class="wx-temp">${Math.round(c.temperature_2m)}°</div>
          <div class="wx-cond">${describe(c.weather_code)[0]}</div>
          <div class="wx-hilo">H ${Math.round(w.daily.temperature_2m_max[0])}°  ·  L ${Math.round(w.daily.temperature_2m_min[0])}°</div>
          <div class="chips-row">
            <span class="stat-chip"><small>Feels</small><b>${Math.round(c.apparent_temperature)}°</b></span>
            <span class="stat-chip"><small>Rain</small><b>${w.daily.precipitation_probability_max[0]}%</b></span>
            <span class="stat-chip"><small>Wind</small><b>${Math.round(c.wind_speed_10m)}<i>km/h</i></b></span>
            <span class="stat-chip"><small>UV</small><b>${Math.round(w.daily.uv_index_max[0])}</b></span>
          </div>
          <div class="hourly-panel">${hourlyCurve(w)}</div>
        </div>`;
    } else wx.innerHTML = '<div class="wx-body">Weather unavailable</div>';

    // Calendar
    const evs = (await getEvents(7)).filter((e) => e.end > t).slice(0, 5);
    const dayLabel = (d) => (sameDay(d, t) ? 'Today' : sameDay(d, addDays(t, 1)) ? 'Tomorrow' : fmtShort(d));
    root.querySelector('[data-events]').innerHTML = evs.map((e) => `
      <li><span class="bar" style="background:${personColour(e.person)}"></span>
      <span class="ev-main"><b>${esc(e.title)}</b><small>${dayLabel(e.start)}${e.allDay ? '' : ' · ' + fmtTime(e.start)}</small></span></li>`).join('')
      || '<li class="muted">Nothing coming up</li>';

    // Shopping (tap to tick)
    this.shop = (await getList('groceries')).filter((i) => !i.done);
    root.querySelector('[data-shop-count]').textContent = this.shop.length ? `${this.shop.length} items` : '';
    root.querySelector('[data-shop]').innerHTML = this.shop.slice(0, 5).map((i) => `
      <li data-shop-item="${esc(i.id)}"><span class="ring">${icon('check')}</span>${esc(i.text)}</li>`).join('')
      + (this.shop.length > 5 ? `<li class="muted more" data-goto="lists">+${this.shop.length - 5} more</li>` : '')
      || '<li class="muted">All done</li>';

    // Tonight's meal
    root.querySelector('[data-meal]').textContent = getMeals()[t.getDay()] || 'Not planned';

    // Bins: card takes the colour of this week's alternating lid
    const bin = nextCollection(t);
    const alt = bin.lids.find((l) => l !== 'red');
    const remind = binReminderActive(t);
    const daysTo = Math.round((startOfDay(bin.date) - startOfDay(t)) / 864e5);
    root.querySelector('[data-bins]').style.setProperty('--lid', LIDS[alt].colour);
    root.querySelector('[data-bins]').classList.toggle('remind', remind);
    root.querySelector('[data-bins]').innerHTML = `
      <div class="bin-icons">${bin.lids.map((l) => `<span class="lid-dot" style="background:${LIDS[l].colour}">${icon('bins')}</span>`).join('')}</div>
      <div><div class="kicker">${remind ? 'Tonight' : daysTo === 0 ? 'Today' : daysTo === 1 ? 'Tomorrow' : fmtShort(bin.date)}</div>
      <b>${remind ? 'Bins out: ' : ''}${LIDS[alt].label} + general</b></div>`;

    // Notes
    root.querySelector('[data-notes]').innerHTML = getNotes().slice(0, 3).map((n) => {
      const p = CONFIG.people.find((x) => x.id === n.from);
      return `<li><span class="avatar" style="background:${p?.colour}">${esc(p?.name?.[0])}</span>
        <span>${esc(n.text)}</span><button class="x" data-del="${n.id}" aria-label="Remove">${icon('close')}</button></li>`;
    }).join('') || '<li class="muted">No notes</li>';

    // Header pills: glanceable status
    const pills = [];
    if (remind) pills.push(`<span class="pill alert-pill" data-goto="bins">${icon('bins')} Bins out tonight</span>`);
    const ev = haEnabled() ? await num(CONFIG.homeAssistant.entities.evBattery) : 24;
    if (ev != null) pills.push(`<span class="pill ${ev < CONFIG.ev.lowPercent ? 'alert-pill' : ''}" data-goto="ev">${icon('ev')} ${Math.round(ev)}%${ev < CONFIG.ev.lowPercent ? ' · plug in' : ''}</span>`);
    if (CONFIG.commute.days.includes(t.getDay()) && t.getHours() < 10) {
      const [hh, mm] = CONFIG.commute.officeArrive.split(':').map(Number);
      const leave = new Date(t); leave.setHours(hh, mm - CONFIG.commute.typicalMinutes, 0, 0);
      pills.push(`<span class="pill" data-goto="commute">${icon('commute')} Leave ${fmtTime(leave)}</span>`);
    }
    root.querySelector('[data-pills]').innerHTML = pills.join('');
  },
};
