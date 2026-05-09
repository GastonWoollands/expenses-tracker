/**
 * Light / dark mode toggle
 */

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-control)] text-fg-muted hover:text-fg hover:bg-surface-hover active:opacity-80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
