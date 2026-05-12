export type Preferences = {
  lastOpenedProjectId: string | null;
  theme: 'light' | 'dark';
  gridSizeMm: number;
  lastUsedUnit: 'mm' | 'cm' | 'm';
};

const KEY = 'mlp:preferences';

const defaults = (): Preferences => ({
  lastOpenedProjectId: null,
  theme: 'light',
  gridSizeMm: 50,
  lastUsedUnit: 'mm',
});

const isPreferences = (raw: unknown): raw is Preferences => {
  if (typeof raw !== 'object' || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return (
    (o.lastOpenedProjectId === null || typeof o.lastOpenedProjectId === 'string') &&
    (o.theme === 'light' || o.theme === 'dark') &&
    typeof o.gridSizeMm === 'number' &&
    Number.isFinite(o.gridSizeMm) &&
    o.gridSizeMm > 0 &&
    (o.lastUsedUnit === 'mm' || o.lastUsedUnit === 'cm' || o.lastUsedUnit === 'm')
  );
};

export const loadPreferences = (): Preferences => {
  if (typeof localStorage === 'undefined') return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed: unknown = JSON.parse(raw);
    if (!isPreferences(parsed)) return defaults();
    return parsed;
  } catch {
    return defaults();
  }
};

export const savePreferences = (p: Preferences): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch (err) {
    console.error('savePreferences failed', err);
  }
};
