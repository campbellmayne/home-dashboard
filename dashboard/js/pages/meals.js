import { esc, now } from '../util.js';
import { getMeals, setMeal } from '../data.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default {
  id: 'meals', label: 'Meals',
  render(root) {
    root.innerHTML = `
      <div class="grid meals-grid">
        <section class="card tonight"><h2>Tonight</h2><div class="tonight-meal" data-tonight></div></section>
        <section class="card"><h2>This week</h2><ul class="meal-week" data-week></ul>
          <p class="muted small">Tap a day to change it.</p></section>
      </div>`;
    root.querySelector('[data-week]').addEventListener('click', (e) => {
      const li = e.target.closest('[data-dow]');
      if (!li) return;
      const dow = Number(li.dataset.dow);
      const v = prompt(`Dinner for ${DAYS[dow]}?`, getMeals()[dow] ?? '');
      if (v != null) { setMeal(dow, v.trim()); this.refresh(root); }
    });
  },
  refresh(root) {
    const meals = getMeals();
    const today = now().getDay();
    root.querySelector('[data-tonight]').textContent = meals[today] || 'Not planned yet';
    root.querySelector('[data-week]').innerHTML = Array.from({ length: 7 }, (_, i) => (today + i) % 7).map((d, i) => `
      <li data-dow="${d}" class="${d === today ? 'today' : ''}"><b>${i === 0 ? 'Tonight' : DAYS[d]}</b><span>${esc(meals[d] || '–')}</span></li>`).join('');
  },
};
