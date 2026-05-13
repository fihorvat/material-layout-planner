import { create } from 'zustand';
import { loadPreferences, savePreferences } from '@/storage';

export type Theme = 'light' | 'dark';

export type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_ATTR = 'data-theme';

const readInitialTheme = (): Theme => {
  try {
    return loadPreferences().theme;
  } catch {
    return 'light';
  }
};

const applyThemeToDom = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(THEME_ATTR, theme);
};

const persistTheme = (theme: Theme): void => {
  try {
    const prefs = loadPreferences();
    if (prefs.theme === theme) return;
    savePreferences({ ...prefs, theme });
  } catch {
    // ignore persistence errors
  }
};

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    if (get().theme === theme) return;
    applyThemeToDom(theme);
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyThemeToDom(next);
    persistTheme(next);
    set({ theme: next });
  },
}));

export const getTheme = (): Theme => useThemeStore.getState().theme;

/** Apply the initial theme to <html> before React renders to avoid a flash. */
export const initializeTheme = (): void => {
  applyThemeToDom(useThemeStore.getState().theme);
};
