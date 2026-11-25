// Illustrated weather backgrounds (SVG), so the conditions read from across the room.
// sceneKind() maps an Open-Meteo weather code + day/night to one of the scenes below.

export function sceneKind(code, isDay = true) {
  if (code >= 95) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'cloudy';
  if (code === 1 || code === 2) return isDay ? 'partly' : 'partly-night';
  return isDay ? 'clear' : 'night';
}

// Whether text on top of the scene should be light (true) or dark.
export const lightText = (kind) => ['rain', 'storm', 'night', 'partly-night'].includes(kind);

const SKY = {
  clear: ['#7fb8f0', '#cfe4f7', '#fbe5cc'],
  partly: ['#97c1ea', '#d4e4f3', '#f7e3d2'],
  cloudy: ['#b4bfcd', '#d3d9e1', '#e9ecf0'],
  rain: ['#4c5d76', '#6c7d95', '#97a5b8'],
  storm: ['#232838', '#3b4057', '#5f617a'],
  fog: ['#cfd4da', '#e0e3e7', '#eef0f2'],
  night: ['#0c1630', '#1b2a55', '#3a4a7a'],
  'partly-night': ['#111a33', '#22305a', '#414f7c'],
};

// A soft cloud built from circles; s = scale, o = opacity.
function cloud(x, y, s, fill, o = 1) {
  const c = [[0, 0, 38], [42, -18, 48], [92, -4, 40], [124, 10, 28], [-30, 12, 26]];
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity="${o}">
    ${c.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('')}
    <rect x="-30" y="8" width="160" height="30" rx="15"/></g>`;
}

function stars(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (i * 97) % 600; const y = (i * 53) % 220; const r = (i % 3) * 0.5 + 0.8;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.35 + (i % 4) * 0.15}"/>`;
  }
  return s;
}

function rain(dark) {
  let s = '';
  for (let i = 0; i < 46; i++) {
    const x = 230 + ((i * 37) % 380); const y = 150 + ((i * 61) % 250);
    s += `<line x1="${x}" y1="${y}" x2="${x - 9}" y2="${y + 26}"/>`;
  }
  return `<g class="rain-fall" stroke="${dark ? '#c9d6ea' : '#e7eef8'}" stroke-width="2.4" stroke-linecap="round" opacity=".7">${s}</g>`;
}

export function scene(kind) {
  const [a, b, c] = SKY[kind] ?? SKY.clear;
  const id = `g${Math.random().toString(36).slice(2, 7)}`;
  let art = '';
  switch (kind) {
    case 'clear':
      art = `<circle cx="470" cy="120" r="120" fill="url(#${id}s)"/><circle cx="470" cy="120" r="54" fill="#ffb54a"/>
        ${cloud(400, 330, 0.9, '#fff', 0.55)}`;
      break;
    case 'partly':
      art = `<circle cx="450" cy="110" r="110" fill="url(#${id}s)"/><circle cx="450" cy="110" r="50" fill="#ffb54a"/>
        ${cloud(470, 120, 1.15, '#fff', 0.95)}${cloud(330, 210, 0.8, '#fff', 0.85)}${cloud(470, 310, 1, '#fff', 0.6)}`;
      break;
    case 'cloudy':
      art = `${cloud(350, 90, 1.1, '#9aa6b6', 0.8)}${cloud(440, 150, 1.4, '#f4f6f8', 0.95)}${cloud(300, 240, 1, '#fff', 0.85)}${cloud(480, 300, 1.2, '#e3e7ec')}`;
      break;
    case 'rain':
      art = `${rain(true)}${cloud(330, 80, 1.2, '#3e4c62', 0.9)}${cloud(450, 120, 1.4, '#56657d')}${cloud(300, 170, 0.9, '#6a7891', 0.9)}`;
      break;
    case 'storm':
      art = `${rain(true)}<path d="M470 170l-34 70h30l-22 64 64-92h-32l24-42z" fill="#ffd24a"/>
        ${cloud(330, 80, 1.2, '#1c2030', 0.9)}${cloud(440, 120, 1.5, '#2b3044')}`;
      break;
    case 'fog':
      art = [90, 150, 210, 270, 330].map((y, i) =>
        `<rect x="${i % 2 ? 140 : 60}" y="${y}" width="${520 - (i % 2) * 60}" height="22" rx="11" fill="#fff" opacity=".7"/>`).join('');
      break;
    case 'night':
    case 'partly-night':
      art = `${stars(40)}<circle cx="470" cy="110" r="100" fill="url(#${id}m)"/><circle cx="470" cy="110" r="42" fill="#f3ecd2"/>
        <circle cx="490" cy="96" r="38" fill="${a}"/>
        ${kind === 'partly-night' ? cloud(430, 160, 1.2, '#55628a', 0.9) + cloud(320, 260, 0.9, '#3f4b73', 0.8) : ''}`;
      break;
  }
  return `<svg class="scene" viewBox="0 0 600 400" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
      <radialGradient id="${id}s"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}m"><stop offset="0" stop-color="#f3ecd2" stop-opacity=".35"/><stop offset="1" stop-color="#f3ecd2" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="600" height="400" fill="url(#${id})"/>${art}</svg>`;
}
