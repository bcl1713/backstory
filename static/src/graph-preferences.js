// Presentation settings only. No paths, topology or note contents enter storage.
const key = 'backstory.graph.forces.v1';
export const DEFAULT_FORCES = Object.freeze({ spring: 1, repulsion: 1, gravity: 1 });
export function validateForces(value) {
  return Object.fromEntries(Object.entries(DEFAULT_FORCES).map(([name, fallback]) => {
    const number = value?.[name];
    return [name, typeof number === 'number' && Number.isFinite(number) && number >= .25 && number <= 4 ? Math.round(number * 4) / 4 : fallback];
  }));
}
export function loadForces(storage) {
  try { const value = JSON.parse(storage?.getItem(key) || 'null'); if (value?.version === 1) return validateForces(value); } catch { /* Storage is optional. */ }
  return { ...DEFAULT_FORCES };
}
export function saveForces(storage, value) {
  try { storage?.setItem(key, JSON.stringify({ version: 1, ...validateForces(value) })); } catch { /* Page-local tuning still works. */ }
}
