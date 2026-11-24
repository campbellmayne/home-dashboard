import { esc } from '../util.js';
import { LISTS, getList, addItem, toggleItem, clearDone } from '../data.js';

export default {
  id: 'lists', label: 'Lists', icon: '✅',
  render(root) {
    root.innerHTML = `<div class="grid cols-3">${LISTS.map((l) => `
      <section class="card list-card" data-list="${l.id}">
        <div class="page-head"><h2>${l.label}</h2><button class="btn ghost small" data-clear>Clear ticked</button></div>
        <form class="row" data-add><input placeholder="Add to ${l.label.toLowerCase()}…" /><button class="btn">+</button></form>
        <ul class="checklist" data-items></ul>
      </section>`).join('')}</div>`;

    root.addEventListener('submit', async (e) => {
      e.preventDefault();
      const card = e.target.closest('[data-list]');
      const input = e.target.querySelector('input');
      if (!input.value.trim()) return;
      await addItem(card.dataset.list, input.value.trim());
      input.value = '';
      this.refresh(root);
    });
    root.addEventListener('click', async (e) => {
      const card = e.target.closest('[data-list]');
      if (!card) return;
      if (e.target.closest('[data-clear]')) { await clearDone(card.dataset.list); this.refresh(root); return; }
      const li = e.target.closest('[data-item]');
      if (li) {
        const item = this.items[card.dataset.list].find((i) => i.id === li.dataset.item);
        li.classList.toggle('done');
        await toggleItem(card.dataset.list, item);
        this.refresh(root);
      }
    });
  },
  items: {},
  async refresh(root) {
    for (const l of LISTS) {
      const items = await getList(l.id);
      this.items[l.id] = items;
      items.sort((a, b) => a.done - b.done);
      root.querySelector(`[data-list="${l.id}"] [data-items]`).innerHTML = items.map((i) => `
        <li data-item="${esc(i.id)}" class="${i.done ? 'done' : ''}"><span class="box"></span>${esc(i.text)}</li>`).join('')
        || '<li class="muted">Empty</li>';
    }
  },
};
