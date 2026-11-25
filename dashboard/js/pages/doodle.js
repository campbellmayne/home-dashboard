import { esc } from '../util.js';
import { load, save, uid } from '../store.js';

const COLOURS = ['#ffffff', '#4f9dff', '#ff7aa8', '#f5c518', '#30a46c', '#e5484d'];

export default {
  id: 'doodle', label: 'Notes',
  render(root) {
    root.innerHTML = `<div class="grid doodle-grid">
      <section class="card pad-card">
        <div class="page-head"><h2>Doodle</h2><div class="chips">
          ${COLOURS.map((c, i) => `<button class="swatch ${i === 0 ? 'on' : ''}" data-colour="${c}" style="background:${c}" aria-label="Colour"></button>`).join('')}
          <button class="btn ghost small" data-clear>Clear</button></div></div>
        <canvas data-pad></canvas></section>
      <section class="card"><h2>Quick notes</h2>
        <form class="row" data-add><input placeholder="Jot something…" /><button class="btn">+</button></form>
        <ul class="quick-notes" data-notes></ul></section></div>`;

    const canvas = root.querySelector('[data-pad]');
    const ctx = canvas.getContext('2d');
    let colour = COLOURS[0]; let drawing = false; let fitted = false;
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const img = fitted ? canvas.toDataURL() : load('doodle', null);
      fitted = true;
      canvas.width = r.width * devicePixelRatio; canvas.height = r.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 5;
      if (img) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = img; }
    };
    this.fit = fit;
    new ResizeObserver(fit).observe(canvas);
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', (e) => {
      drawing = true; canvas.setPointerCapture(e.pointerId);
      ctx.strokeStyle = colour; ctx.beginPath(); ctx.moveTo(...pos(e)); ctx.lineTo(...pos(e)); ctx.stroke();
    });
    canvas.addEventListener('pointermove', (e) => { if (drawing) { ctx.lineTo(...pos(e)); ctx.stroke(); } });
    const end = () => { if (drawing) { drawing = false; save('doodle', canvas.toDataURL()); } };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    root.addEventListener('click', (e) => {
      const sw = e.target.closest('[data-colour]');
      if (sw) { colour = sw.dataset.colour; root.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('on', s === sw)); }
      if (e.target.closest('[data-clear]')) { ctx.clearRect(0, 0, canvas.width, canvas.height); save('doodle', null); }
      const del = e.target.closest('[data-del]');
      if (del) { save('quickNotes', load('quickNotes', []).filter((n) => n.id !== del.dataset.del)); this.refresh(root); }
    });
    root.querySelector('[data-add]').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      if (!input.value.trim()) return;
      save('quickNotes', [{ id: uid(), text: input.value.trim() }, ...load('quickNotes', [])]);
      input.value = ''; this.refresh(root);
    });
  },
  onShow() { this.fit?.(); },
  refresh(root) {
    root.querySelector('[data-notes]').innerHTML = load('quickNotes', []).map((n) => `
      <li>${esc(n.text)}<button class="x" data-del="${n.id}">×</button></li>`).join('') || '<li class="muted">No notes</li>';
  },
};
