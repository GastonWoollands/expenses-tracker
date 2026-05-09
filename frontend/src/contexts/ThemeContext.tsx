/**
 * Theme context: light / dark / system, minimal "nothing" visual theme, localStorage
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { VisualTheme } from './visualTheme';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  visualTheme: VisualTheme;
  setTheme: (theme: Theme) => void;
  setVisualTheme: (visual: VisualTheme) => void;
  toggle: () => void;
  toggleVisualTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'app-theme';
const VISUAL_STORAGE_KEY = 'app-visual-theme';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function themeColorForMeta(resolved: 'light' | 'dark', visual: VisualTheme): string {
  if (visual === 'nothing') {
    return resolved === 'dark' ? '#0a0a0a' : '#fafafa';
  }
  return resolved === 'dark' ? '#0f172a' : '#f8fafc';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'dark';
  });

  const [visualTheme, setVisualThemeState] = useState<VisualTheme>(() => {
    if (typeof window === 'undefined') return 'default';
    const stored = localStorage.getItem(VISUAL_STORAGE_KEY) as VisualTheme | null;
    return stored === 'nothing' ? 'nothing' : 'default';
  });

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemPrefersDark() ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;

    html.classList.remove('dark');
    if (resolvedTheme === 'dark') {
      html.classList.add('dark');
    }

    if (visualTheme === 'nothing') {
      html.setAttribute('data-visual', 'nothing');
    } else {
      html.removeAttribute('data-visual');
    }

    void html.offsetHeight;

    const themeColor = themeColorForMeta(resolvedTheme, visualTheme);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor);
    }
  }, [resolvedTheme, visualTheme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, t);
    }
  }, []);

  const setVisualTheme = useCallback((v: VisualTheme) => {
    setVisualThemeState(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VISUAL_STORAGE_KEY, v);
    }
  }, []);

  const toggle = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  const toggleVisualTheme = useCallback(() => {
    setVisualTheme(visualTheme === 'nothing' ? 'default' : 'nothing');
  }, [visualTheme, setVisualTheme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      visualTheme,
      setTheme,
      setVisualTheme,
      toggle,
      toggleVisualTheme,
    }),
    [theme, resolvedTheme, visualTheme, setTheme, setVisualTheme, toggle, toggleVisualTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with ThemeProvider
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
