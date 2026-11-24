import { esc } from '../util.js';
import { load, save, uid } from '../store.js';

// Add a recipe from the browser console: hdAddRecipe({ name, serves, ingredients: [], steps: [{ text, min }] })
window.hdAddRecipe = (r) => save('recipes', [...load('recipes', demoRecipes), { id: uid(), serves: 2, ...r }]);

const demoRecipes = [
  {
    id: 'r1', name: 'Thai green curry', serves: 4,
    ingredients: ['2 tbsp green curry paste', '400 ml coconut milk', '500 g chicken thigh', '1 cup green beans', 'Thai basil, lime, fish sauce'],
    steps: [
      { text: 'Fry curry paste in a splash of coconut cream until fragrant.', min: 2 },
      { text: 'Add sliced chicken and brown.', min: 5 },
      { text: 'Pour in coconut milk, simmer.', min: 10 },
      { text: 'Add beans, simmer until tender.', min: 4 },
      { text: 'Season with fish sauce and lime, top with basil.', min: 0 },
    ],
  },
  {
    id: 'r2', name: 'Soft-boiled eggs', serves: 2,
    ingredients: ['4 eggs'],
    steps: [{ text: 'Lower eggs into boiling water.', min: 6.5 }, { text: 'Move to iced water.', min: 2 }, { text: 'Peel and serve.', min: 0 }],
  },
];

const timers = []; // { id, label, endsAt, total }
let beepCtx;
function beep() {
  try {
    beepCtx ??= new AudioContext();
    const o = beepCtx.createOscillator(); const g = beepCtx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(beepCtx.destination);
    g.gain.setValueAtTime(0.3, beepCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, beepCtx.currentTime + 0.8);
    o.start(); o.stop(beepCtx.currentTime + 0.8);
  } catch {}
}
export function addTimer(label, minutes) {
  timers.push({ id: uid(), label, total: minutes * 60e3, endsAt: Date.now() + minutes * 60e3 });
}
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default {
  id: 'recipes', label: 'Recipes', icon: '📖',
  state: { recipe: null, step: 0 },
  render(root) {
    root.innerHTML = `<div class="grid recipe-grid">
      <section class="card" data-main></section>
      <section class="card timers"><h2>Timers</h2>
        <div class="chips">${[1, 3, 5, 10, 15, 30].map((m) => `<button class="chip" data-quick="${m}">${m} min</button>`).join('')}</div>
        <ul data-timers></ul></section></div>`;
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-quick],[data-open],[data-back],[data-prev],[data-next],[data-steptimer],[data-cancel]');
      if (!t) return;
      const d = t.dataset;
      if (d.quick) addTimer(`${d.quick} min timer`, Number(d.quick));
      if (d.open) this.state = { recipe: d.open, step: 0 };
      if ('back' in d) this.state.recipe = null;
      if ('prev' in d) this.state.step = Math.max(0, this.state.step - 1);
      if ('next' in d) this.state.step++;
      if (d.steptimer) { const [label, min] = JSON.parse(d.steptimer); addTimer(label, min); }
      if (d.cancel) timers.splice(timers.findIndex((x) => x.id === d.cancel), 1);
      this.refresh(root);
    });
  },
  tick(root) {
    const list = root?.querySelector('[data-timers]');
    if (!list) return;
    for (const t of timers) {
      if (!t.rang && t.endsAt <= Date.now()) { t.rang = true; beep(); setTimeout(beep, 1000); setTimeout(beep, 2000); }
    }
    list.innerHTML = timers.map((t) => {
      const left = t.endsAt - Date.now();
      return `<li class="${left <= 0 ? 'alert' : ''}"><span>${esc(t.label)}</span><b>${left <= 0 ? 'Done!' : mmss(left)}</b>
        <progress max="${t.total}" value="${Math.max(0, left)}"></progress><button class="x" data-cancel="${t.id}">×</button></li>`;
    }).join('') || '<li class="muted">No timers running</li>';
  },
  refresh(root) {
    const recipes = load('recipes', demoRecipes);
    const main = root.querySelector('[data-main]');
    const r = recipes.find((x) => x.id === this.state.recipe);
    if (!r) {
      main.innerHTML = `<h2>Recipe book</h2><div class="recipe-list">${recipes.map((x) => `
        <button class="recipe-tile" data-open="${x.id}"><b>${esc(x.name)}</b><small>${x.steps.length} steps · serves ${x.serves}</small></button>`).join('')}</div>
        <p class="muted small">Add recipes with hdAddRecipe() in the browser console for now (see README).</p>`;
    } else {
      const i = Math.min(this.state.step, r.steps.length);
      const step = r.steps[i];
      main.innerHTML = `<div class="page-head"><h2>${esc(r.name)}</h2><button class="btn ghost small" data-back>All recipes</button></div>
        ${i === 0 ? `<h3>Ingredients</h3><ul class="ingredients">${r.ingredients.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${step ? `<div class="step"><small>Step ${i + 1} of ${r.steps.length}</small><p>${esc(step.text)}</p>
          ${step.min ? `<button class="btn" data-steptimer='${esc(JSON.stringify([`${r.name}: step ${i + 1}`, step.min]))}'>Start ${step.min} min timer</button>` : ''}</div>`
          : '<div class="step"><p>Done. Enjoy!</p></div>'}
        <div class="row"><button class="btn ghost" data-prev ${i === 0 ? 'disabled' : ''}>← Back</button>
        <button class="btn" data-next ${!step ? 'disabled' : ''}>Next →</button></div>`;
    }
    this.tick(root);
  },
};
