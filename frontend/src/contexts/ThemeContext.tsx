/**
 * Simple theme context with dark/light/system and localStorage persistence
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'app-theme';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'dark';
  });

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemPrefersDark() ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    console.log('Theme effect running:', { theme, resolvedTheme, hasDarkClass: root.classList.contains('dark') });
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      console.log('Added dark class');
    } else {
      root.classList.remove('dark');
      console.log('Removed dark class');
    }
    
    // Update theme-color meta tag for PWA
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [resolvedTheme, theme]);

  const setTheme = useCallback((t: Theme) => {
    console.log('setTheme called with:', t);
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, t);
      console.log('Saved to localStorage:', t);
    }
  }, []);

  const toggle = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    console.log('Theme toggle:', { current: resolvedTheme, new: newTheme, theme });
    setTheme(newTheme);
  }, [resolvedTheme, theme, setTheme]);

  const value: ThemeContextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggle,
  }), [theme, resolvedTheme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};


