// Household settings. Edit this file, then reload the display.
// Anything marked TODO is an open question in README.md.

export const CONFIG = {
  theme: 'ink', // ink (light, cool) | clay (dark, terracotta) | coral (bright white, coral)

  location: { name: 'Melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },

  people: [
    { id: 'me', name: 'Campbell', colour: '#4f9dff' },
    { id: 'partner', name: 'Partner', colour: '#ff7aa8' }, // TODO: name
  ],

  // Home Assistant. Leave url empty to run on local demo data.
  // Token: HA profile > Security > Long-lived access tokens.
  // Also add this page's origin to http: cors_allowed_origins in HA configuration.yaml.
  homeAssistant: {
    url: '', // e.g. 'http://homeassistant.local:8123'
    token: '',
    entities: {
      evPlugPower: 'sensor.ev_plug_power',      // Shelly Plug S, W
      evPlugEnergy: 'sensor.ev_plug_energy',    // kWh total
      evBattery: 'sensor.byd_battery_level',    // % (hass-byd-vehicle or WiCAN)
      evRange: 'sensor.byd_range',              // km
      solarPower: '',                           // TODO: solar installed?
      gridPower: '',
      indoorTemp: '',
      lights: [],                               // e.g. ['light.lounge', 'light.kitchen']
      groceries: 'todo.groceries',
      chores: 'todo.chores',
      errands: 'todo.errands',
      calendars: [],                            // e.g. [{ entity: 'calendar.campbell', person: 'me' }]
      aiSpendMonth: '',                         // sensor with AUD spent this month
      aiTokensToday: '',
      presence: '',                             // motion sensor near the display, e.g. binary_sensor.hall_motion
    },
  },

  // Electricity tariff for EV charge cost estimates (AUD per kWh).
  tariff: { perKwh: 0.30 }, // TODO: check your bill

  ev: { model: 'BYD (TODO)', batteryKwh: 60.5, lowPercent: 30 },

  // Commute page only shows on these days (0 = Sun).
  commute: {
    days: [2, 3, 5],
    mode: 'drive', // TODO: drive | train | tram
    officeArrive: '09:00',
    typicalMinutes: 35, // fallback until a traffic source is connected
    ptvLink: 'https://www.ptv.vic.gov.au/journey',
  },

  // Bins: collected Thursday. Green and yellow alternate; red every week.
  bins: {
    collectionDay: 4, // Thursday
    referenceDate: '2026-11-26', // a known green-waste Thursday
    referenceLid: 'green',
    reminderHour: 17, // show "put bins out" from 5pm the evening before
  },

  // Time-based modes (24h clock, local time).
  modes: {
    morning: { from: 6, to: 9, page: 'home' },
    daytime: { from: 9, to: 17, page: 'home', slideshowAfterIdleMin: 5 },
    evening: { from: 17, to: 22, page: 'meals' },
    night:   { from: 22, to: 6 },
  },

  idleReturnMin: 3, // jump back to the mode's default page after this idle time
};
