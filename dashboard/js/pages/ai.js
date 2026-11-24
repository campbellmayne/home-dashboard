import { CONFIG } from '../config.js';
import { aud } from '../util.js';
import { haEnabled, num } from '../ha.js';

const E = CONFIG.homeAssistant.entities;

async function apiStatus() {
  // Public status pages (Statuspage JSON). Fails quietly if blocked.
  const check = async (name, url) => {
    try {
      const r = await fetch(url);
      const j = await r.json();
      return { name, ok: j.status?.indicator === 'none', text: j.status?.description ?? '?' };
    } catch { return { name, ok: null, text: 'Unknown' }; }
  };
  return Promise.all([check('Claude', 'https://status.claude.com/api/v2/status.json')]);
}

export default {
  id: 'ai', label: 'AI', icon: '🤖',
  render(root) {
    root.innerHTML = `<div class="page-head"><h1>AI status</h1></div>
      <div class="grid cols-3" data-stats></div>
      <section class="card"><h2>API status</h2><ul class="status" data-status></ul></section>
      <section class="card"><h2>Running tasks</h2><ul data-tasks><li class="muted">Voice assistant not set up yet (build step 4)</li></ul></section>`;
  },
  async refresh(root) {
    const [spend, tokens] = haEnabled() && E.aiSpendMonth
      ? await Promise.all([num(E.aiSpendMonth), num(E.aiTokensToday)])
      : [null, null];
    root.querySelector('[data-stats]').innerHTML = `
      <section class="card stat"><h2>Spend this month</h2><div class="stat-v">${aud(spend)}</div></section>
      <section class="card stat"><h2>Tokens today</h2><div class="stat-v">${tokens?.toLocaleString('en-AU') ?? '–'}</div></section>
      <section class="card stat"><h2>Assistant</h2><div class="stat-v small-v">Not connected</div></section>`;
    const st = await apiStatus();
    root.querySelector('[data-status]').innerHTML = st.map((s) => `
      <li><span class="dot" style="background:${s.ok == null ? '#888' : s.ok ? '#30a46c' : '#e5484d'}"></span>${s.name}: ${s.text}</li>`).join('');
  },
};
