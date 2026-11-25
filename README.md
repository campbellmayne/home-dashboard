# home-dashboard

Wall-hung touch dashboard and (later) voice assistant for our place in Melbourne, replacing a Google Home Max. Runs on a Raspberry Pi 5 driving an old espresso-machine touch display, in a Chromium kiosk.

**Status: build step 1 done in software.** All 12 pages work on demo data, with live weather. Hook up Home Assistant to make calendar, lists, energy and EV live.

## Try it now (any computer)

```bash
cd dashboard && python3 -m http.server 8080
# open http://localhost:8080
# test any time of day: http://localhost:8080/?now=2026-11-25T18:00
```

## Pages

Swipe left/right or tap the tab bar. Tapping a Home tile jumps to its page.

| # | Page | Data source |
|---|------|-------------|
| 1 | Home: clock, weather, next events, shopping list, notes for each other, bins and tonight's meal | mixed |
| 2 | Calendar: 7-day week, colour per person | HA `calendar.*` (Google/iCloud) |
| 3 | Lists: groceries, chores, errands, tap to tick | HA `todo.*` (Local To-do, Todoist, Google Tasks) |
| 4 | Meals: tonight + week, tap a day to edit | on device |
| 5 | House and energy: EV kW/kWh, solar, grid, temp, light toggles | HA sensors |
| 6 | AI status: spend, tokens, Claude API status | HA sensors, status.claude.com |
| 7 | Commute: **Tue, Wed, Fri only**. Leave-by time, PTV link | config (traffic source TODO) |
| 8 | Weather and radar: now, 24 h, 7 days, animated radar | Open-Meteo (no key), RainViewer, BoM link |
| 9 | Bins: next collection, reminder from 5 pm the night before, next 4 weeks | computed from config |
| 10 | EV: battery %, range, charging, last charge cost, low-battery plug-in reminder | HA (hass-byd-vehicle / WiCAN) + Shelly plug |
| 11 | Recipes and timers: step-by-step with one-tap step timers, multiple timers with chime | on device |
| 12 | Notes and doodle: finger drawing pad, quick notes | on device |

**Bins:** red every Thursday; green and yellow alternate, anchored on Thu 26 Nov 2026 = green (so 3 Dec = yellow). Change `bins` in `config.js` if the council shifts it.

### Smart behaviour

- **Morning** 6–9: Home. **Daytime** 9–5: Home, photo slideshow after 5 min idle (drop JPGs in `dashboard/photos/` and list them in `photos.json`). **Evening** 5–10: Meals. **Night** 10–6: dim red clock after 1 min idle. Touch wakes it.
- Returns to the mode's page after 3 min idle.
- Wake on presence: set `presence` to a motion `binary_sensor` (ignored at night).

## Configure

Everything lives in [`dashboard/js/config.js`](dashboard/js/config.js): names and colours, HA URL/token/entities, tariff, EV battery size, commute days and arrival time, bin anchor, mode times.

To go live with Home Assistant:
1. Create a long-lived token (HA profile > Security).
2. In HA `configuration.yaml`: `http: cors_allowed_origins: ["http://<pi-ip>:8080"]` (or `http://localhost:8080` if HA runs on the same Pi).
3. Fill `homeAssistant.url`, `token` and entity IDs. Pages switch from demo data automatically.

The token sits in a file on your LAN-only Pi. Don't expose port 8080 to the internet.

Recipes: add from the Chromium console (`hdAddRecipe({ name, ingredients: [...], steps: [{ text, min }] })`) until there's an editor.

## Pi install

Raspberry Pi OS Desktop 64-bit (Bookworm or later), then:

```bash
git clone <this repo> ~/home-dashboard && cd ~/home-dashboard
bash pi/setup.sh && sudo reboot
```

This sets the timezone to Melbourne, serves `dashboard/` on `localhost:8080`, launches Chromium in kiosk mode at login, installs the squeekboard on-screen keyboard and turns off screen blanking. Update later with `git pull` and a reload.

## Hardware

| Item | Notes | ~AUD |
|------|-------|------|
| Raspberry Pi 5, 4 GB (8 GB if running speech locally) | often backordered | 180–285 |
| Official 27 W USB-C PSU, active cooler, 32–64 GB microSD | | 45–70 |
| Micro-HDMI to mini-HDMI cable, 1–2 m | video | 15–25 |
| USB-A to USB-C **data** cable | touch | 10–15 |
| USB-C charger, 20–30 W | powers the display separately | 20–30 |
| USB DAC or audio HAT + powered speaker | Pi 5 has no headphone jack | 20–150 |
| Home Assistant Voice Preview Edition | far-field mic, wake word (step 4) | ~100 |
| Shelly Plug S (12 A), straight into the wall, no power board | EV granny-charger energy | ~45 |

### Display wiring

espresso display (about 7 years old, model unknown): mini-HDMI plus two USB-C ports.

| From | Cable | To display |
|------|-------|------------|
| Pi 5 micro-HDMI **0** (next to the Pi's power port) | micro-HDMI to mini-HDMI | mini-HDMI |
| Pi 5 USB-A port | USB-A to USB-C data cable | USB-C port that carries data (touch) |
| Own 20–30 W USB-C charger | USB-C | the other USB-C port (power) |

- Power the display from its own charger: the Pi 5's USB ports can't supply enough for the screen, and the Pi may brown out and reboot.
- To find the touch port, look for icons beside the ports (a lightning bolt usually means power only). Otherwise, connect HDMI plus one USB-C cable at a time and tap the screen.
- Use a cable known to carry data; charge-only cables won't pass touch.
- Behind the frame, a double powerpoint can take the Pi PSU and the display charger. Never use a power board for the EV plug.

## Build order

1. ~~Dashboard software~~ ✅ → display + Pi + `pi/setup.sh`
2. Home Assistant, EV plug, calendars and to-do lists (fill `config.js`)
3. Spotify Connect + speaker (Raspotify or Music Assistant; needs Premium)
4. Mic + voice: HA Assist, wake word, STT, Claude API, TTS (fiddliest, last)

Frame later: shadow box or 3D-printed bezel with vents and port access.

## Open questions

- [x] Display ports: mini-HDMI (video) + 2× USB-C (power; touch). Still to confirm which USB-C carries touch
- [ ] BYD model (sets `ev.model`, `ev.batteryKwh`)
- [ ] Calendar and list apps (Google, iCloud, Todoist…)
- [ ] Commute mode (drive/train/tram) and work address
- [ ] Solar installed?
- [ ] Partner's name and colour, electricity tariff

## Caveats

- EV car data is unofficial (hass-byd-vehicle cloud, or WiCAN Pro OBD-II); app/firmware updates can break it.
- BoM has no public radar API; the radar uses RainViewer with a link to the BoM loop. Either may change.
- Commute drive time is a fixed estimate until a traffic source (e.g. HA Waze Travel Time) is connected.
