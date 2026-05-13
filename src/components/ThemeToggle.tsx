import { useThemeStore } from '@/state';
import { IconButton } from './IconButton';

export type ThemeToggleProps = {
  /** Optional shortcut hint shown in the tooltip. */
  shortcut?: string;
};

export const ThemeToggle = ({ shortcut }: ThemeToggleProps) => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  return (
    <IconButton
      label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      shortcut={shortcut}
      onClick={() => toggleTheme()}
      ariaPressed={isDark}
    >
      <span aria-hidden>{isDark ? '\u2600' : '\u263E'}</span>
    </IconButton>
  );
};
