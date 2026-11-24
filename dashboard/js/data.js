// Shared data helpers: lists, calendar, bins, meals. Local-first, HA when configured.
import { CONFIG } from './config.js';
import { load, save, uid } from './store.js';
import { haEnabled, todoItems, service, calendarEvents } from './ha.js';
import { addDays, startOfDay, parseIsoDate, now } from './util.js';

// ---------- Lists ----------
export const LISTS = [
  { id: 'groceries', label: 'Groceries' },
  { id: 'chores', label: 'Chores' },
  { id: 'errands', label: 'Errands' },
];

const demoLists = {
  groceries: [{ id: uid(), text: 'Milk', done: false }, { id: uid(), text: 'Coffee beans', done: false }, { id: uid(), text: 'Lemons', done: true }],
  chores: [{ id: uid(), text: 'Vacuum lounge', done: false }, { id: uid(), text: 'Water plants', done: false }],
  errands: [{ id: uid(), text: 'Post office parcel', done: false }],
};

export async function getList(id) {
  const entity = CONFIG.homeAssistant.entities[id];
  if (haEnabled() && entity) {
    const items = await todoItems(entity);
    if (items) return items.map((i) => ({ id: i.uid, text: i.summary, done: i.status === 'completed', ha: true }));
  }
  return load('lists', demoLists)[id] ?? [];
}

export async function addItem(listId, text) {
  const entity = CONFIG.homeAssistant.entities[listId];
  if (haEnabled() && entity) { await service('todo', 'add_item', { entity_id: entity, item: text }); return; }
  const all = load('lists', demoLists);
  (all[listId] ??= []).unshift({ id: uid(), text, done: false });
  save('lists', all);
}

export async function toggleItem(listId, item) {
  const entity = CONFIG.homeAssistant.entities[listId];
  if (item.ha) {
    await service('todo', 'update_item', { entity_id: entity, item: item.id, status: item.done ? 'needs_action' : 'completed' });
    return;
  }
  const all = load('lists', demoLists);
  const it = all[listId].find((i) => i.id === item.id);
  if (it) it.done = !it.done;
  save('lists', all);
}

export async function clearDone(listId) {
  const entity = CONFIG.homeAssistant.entities[listId];
  if (haEnabled() && entity) { await service('todo', 'remove_completed_items', { entity_id: entity }); return; }
  const all = load('lists', demoLists);
  all[listId] = all[listId].filter((i) => !i.done);
  save('lists', all);
}

// ---------- Calendar ----------
function demoEvents() {
  const d0 = startOfDay(now());
  const at = (day, h, m = 0) => { const d = addDays(d0, day); d.setHours(h, m); return d; };
  return [
    { title: 'Gym', start: at(0, 18), end: at(0, 19), person: 'me' },
    { title: 'Dentist', start: at(1, 10, 30), end: at(1, 11, 15), person: 'partner' },
    { title: 'Dinner with friends', start: at(2, 19), end: at(2, 22), person: 'both' },
    { title: 'Team offsite', start: at(3, 9), end: at(3, 16), person: 'me' },
    { title: 'Pilates', start: at(4, 7), end: at(4, 8), person: 'partner' },
    { title: 'Market', start: at(5, 9), end: at(5, 11), person: 'both' },
  ];
}

export async function getEvents(days = 7) {
  const start = startOfDay(now());
  const end = addDays(start, days);
  const cals = CONFIG.homeAssistant.entities.calendars;
  if (haEnabled() && cals.length) {
    const lists = await Promise.all(cals.map(async (c) => {
      const evs = (await calendarEvents(c.entity, start, end)) ?? [];
      return evs.map((e) => ({
        title: e.summary,
        start: new Date(e.start.dateTime ?? e.start.date),
        end: new Date(e.end.dateTime ?? e.end.date),
        allDay: !e.start.dateTime,
        person: c.person,
      }));
    }));
    return lists.flat().sort((a, b) => a.start - b.start);
  }
  return demoEvents();
}

export function personColour(id) {
  if (id === 'both') return '#b48cff';
  return CONFIG.people.find((p) => p.id === id)?.colour ?? '#999';
}

// ---------- Bins ----------
export const LIDS = {
  red: { label: 'General waste', colour: '#e5484d' },
  yellow: { label: 'Recycling', colour: '#f5c518' },
  green: { label: 'Green waste', colour: '#30a46c' },
};

/** Next collection on or after `from` (today counts until the reminder ends at midnight). */
export function nextCollection(from = now()) {
  const { collectionDay, referenceDate, referenceLid } = CONFIG.bins;
  const day = startOfDay(from);
  const diff = (collectionDay - day.getDay() + 7) % 7;
  const date = addDays(day, diff);
  const weeks = Math.round((date - parseIsoDate(referenceDate)) / (7 * 864e5));
  const other = referenceLid === 'green' ? 'yellow' : 'green';
  const alt = ((weeks % 2) + 2) % 2 === 0 ? referenceLid : other;
  return { date, lids: ['red', alt] };
}

export function binReminderActive(t = now()) {
  const tomorrow = addDays(startOfDay(t), 1);
  return tomorrow.getDay() === CONFIG.bins.collectionDay && t.getHours() >= CONFIG.bins.reminderHour;
}

// ---------- Meals ----------
const demoMeals = {
  0: 'Roast chicken', 1: 'Pasta e fagioli', 2: 'Thai green curry', 3: 'Tacos',
  4: 'Salmon, greens and rice', 5: 'Pizza night', 6: 'Leftovers',
};
export const getMeals = () => load('meals', demoMeals);
export const setMeal = (dow, text) => { const m = getMeals(); m[dow] = text; save('meals', m); };

// ---------- Notes for each other ----------
export const getNotes = () => load('notes', [
  { id: uid(), from: 'partner', text: 'Parcel arriving Thursday, can you be home?', at: Date.now() - 36e5 },
]);
export const saveNotes = (n) => save('notes', n);
