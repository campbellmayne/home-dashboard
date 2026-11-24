// Weather from Open-Meteo (free, no API key; uses BoM ACCESS-G among its models).
import { CONFIG } from './config.js';
import { load, save } from './store.js';

const CODES = {
  0: ['Clear', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Cloudy', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'],
  55: ['Heavy drizzle', '🌧️'], 61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  80: ['Showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Heavy showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Storm, hail', '⛈️'], 99: ['Storm, hail', '⛈️'],
};
export const describe = (code) => CODES[code] ?? ['–', '🌡️'];

let inflight = null;

export async function getWeather() {
  const cached = load('weather', null);
  if (cached && Date.now() - cached.at < 15 * 60e3) return cached.data;
  if (inflight) return inflight;
  const { lat, lon, tz } = CONFIG.location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(tz)}`
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m'
    + '&hourly=temperature_2m,precipitation_probability,weather_code&forecast_hours=24'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&forecast_days=7';
  inflight = fetch(url)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => { save('weather', { at: Date.now(), data }); return data; })
    .catch((e) => { console.warn('weather', e); return cached?.data ?? null; })
    .finally(() => { inflight = null; });
  return inflight;
}
