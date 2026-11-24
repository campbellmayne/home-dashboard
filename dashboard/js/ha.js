// Home Assistant REST client. Every call returns null when HA is not configured
// or unreachable, so pages can fall back to demo data.
import { CONFIG } from './config.js';

const ha = CONFIG.homeAssistant;
export const haEnabled = () => Boolean(ha.url && ha.token);

async function call(path, opts = {}) {
  if (!haEnabled()) return null;
  try {
    const res = await fetch(ha.url.replace(/\/$/, '') + path, {
      ...opts,
      headers: { Authorization: `Bearer ${ha.token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.warn('HA', path, e);
    return null;
  }
}

export async function state(entityId) {
  if (!entityId) return null;
  return call(`/api/states/${entityId}`);
}

export async function num(entityId) {
  const s = await state(entityId);
  const n = s ? parseFloat(s.state) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function service(domain, svc, data, withResponse = false) {
  return call(`/api/services/${domain}/${svc}${withResponse ? '?return_response' : ''}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// To-do lists (HA "todo" entities, e.g. Local To-do, Todoist, Google Tasks).
export async function todoItems(entityId) {
  const r = await service('todo', 'get_items', { entity_id: entityId }, true);
  return r?.service_response?.[entityId]?.items ?? null;
}

export async function calendarEvents(entityId, start, end) {
  return call(`/api/calendars/${entityId}?start=${start.toISOString()}&end=${end.toISOString()}`);
}
