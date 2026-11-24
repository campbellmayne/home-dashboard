import { getWeather, describe } from '../weather.js';

// RainViewer public tiles give an animated radar with BoM-derived data for Australia.
// The BoM's own radar loop (IDR023 = Melbourne 128 km) is linked as a fallback.
const RADAR = 'https://www.rainviewer.com/map.html?loc=-37.81,144.96,8&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&c=3&o=83&lm=1&layer=radar&sm=1&sn=1';

export default {
  id: 'weather', label: 'Weather', icon: '🌦️',
  render(root) {
    root.innerHTML = `<div class="grid weather-grid">
      <section class="card"><h2>Now</h2><div data-now></div><h2>Next 24 hours</h2><div class="hourly" data-hourly></div>
        <h2>7 days</h2><div class="daily" data-daily></div></section>
      <section class="card radar"><h2>Rain radar <a class="muted small" href="https://www.bom.gov.au/products/IDR023.loop.shtml" target="_blank">BoM loop</a></h2>
        <iframe data-radar title="Rain radar" loading="lazy"></iframe></section></div>`;
  },
  onShow(root) {
    const f = root.querySelector('[data-radar]');
    if (!f.src) f.src = RADAR; // only load the radar when the page is opened
  },
  async refresh(root) {
    const w = await getWeather();
    if (!w) { root.querySelector('[data-now]').textContent = 'Weather unavailable'; return; }
    const [txt, ico] = describe(w.current.weather_code);
    root.querySelector('[data-now]').innerHTML = `<div class="weather-now big">
      <span class="wx-ico">${ico}</span><span class="wx-temp">${Math.round(w.current.temperature_2m)}°</span>
      <span>${txt}<br><small>Feels ${Math.round(w.current.apparent_temperature)}° · wind ${Math.round(w.current.wind_speed_10m)} km/h · UV ${w.daily.uv_index_max[0]}</small></span></div>`;
    root.querySelector('[data-hourly]').innerHTML = w.hourly.time.map((t, i) => `
      <div><small>${new Date(t).toLocaleTimeString('en-AU', { hour: 'numeric' })}</small>
      <span>${describe(w.hourly.weather_code[i])[1]}</span><b>${Math.round(w.hourly.temperature_2m[i])}°</b>
      <small class="rain">${w.hourly.precipitation_probability[i]}%</small></div>`).join('');
    root.querySelector('[data-daily]').innerHTML = w.daily.time.map((t, i) => `
      <div><small>${i === 0 ? 'Today' : new Date(t).toLocaleDateString('en-AU', { weekday: 'short' })}</small>
      <span>${describe(w.daily.weather_code[i])[1]}</span>
      <b>${Math.round(w.daily.temperature_2m_max[i])}°</b><small>${Math.round(w.daily.temperature_2m_min[i])}°</small>
      <small class="rain">${w.daily.precipitation_probability_max[i]}%</small></div>`).join('');
  },
};
