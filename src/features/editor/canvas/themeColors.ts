import type { Theme } from '@/state';

/**
 * Remap stored shape colors at render time so default light-theme palette
 * colors stay legible on a dark canvas. Custom/user-defined colors pass
 * through unchanged.
 *
 * The set of remappings intentionally matches the defaults defined in
 * `src/types/defaults.ts` plus a few common neutral fills used by canvas
 * renderers.
 */
const DARK_REMAP: Readonly<Record<string, string>> = {
  // Strokes / dark grays -> light slate
  '#1f2937': '#cbd5e1', // gray-800
  '#111827': '#e2e8f0', // gray-900 (also text)
  '#374151': '#cbd5e1', // gray-700 (dimension stroke)

  // Light neutral fills -> dark slate
  '#e5e7eb': '#475569', // gray-200 (surface fill)
  '#ffffff': '#1e293b', // white (hole fill, label bg)
  '#cbd5e1': '#475569', // slate-300 (label border)

  // Mid grays -> slightly lifted slate
  '#9ca3af': '#64748b',
  '#6b7280': '#94a3b8',
};

const normalize = (c: string): string => c.trim().toLowerCase();

/** Return a color that is legible on the given theme's canvas background. */
export const themedShapeColor = (color: string | undefined, theme: Theme): string => {
  if (!color) return color ?? '';
  if (theme !== 'dark') return color;
  const key = normalize(color);
  return DARK_REMAP[key] ?? color;
};
