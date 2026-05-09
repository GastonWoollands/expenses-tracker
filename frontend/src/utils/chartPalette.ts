/**
 * Chart colors aligned with color mode + visual theme (Recharts).
 */

import type { VisualTheme } from '../contexts/visualTheme';

export type ChartPalette = {
  grid: string;
  axis: string;
  label: string;
  barPrimary: string;
  barSecondary: string;
  tooltip: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    padding: string;
    boxShadow: string;
  };
  neutral: string;
  positive: string;
  negative: string;
  pie: string[];
};

const DEFAULT_PIE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

const NOTHING_PIE_LIGHT = [
  '#0a0a0a',
  '#262626',
  '#404040',
  '#525252',
  '#737373',
  '#a3a3a3',
  '#d4d4d4',
  '#171717',
  '#525252',
  '#404040',
];

const NOTHING_PIE_DARK = [
  '#fafafa',
  '#e5e5e5',
  '#d4d4d4',
  '#a3a3a3',
  '#737373',
  '#525252',
  '#404040',
  '#262626',
  '#d4d4d4',
  '#a3a3a3',
];

export function getChartPalette(resolvedTheme: 'light' | 'dark', visualTheme: VisualTheme): ChartPalette {
  if (visualTheme === 'nothing') {
    const isDark = resolvedTheme === 'dark';
    return {
      grid: isDark ? '#262626' : '#e8e8e8',
      axis: isDark ? '#a3a3a3' : '#737373',
      label: isDark ? '#a3a3a3' : '#737373',
      barPrimary: isDark ? '#737373' : '#525252',
      barSecondary: isDark ? '#525252' : '#a3a3a3',
      tooltip: {
        backgroundColor: isDark ? '#171717' : '#fafafa',
        border: `1px solid ${isDark ? '#262626' : '#e8e8e8'}`,
        borderRadius: '2px',
        padding: '8px 12px',
        boxShadow: 'none',
      },
      neutral: isDark ? '#a3a3a3' : '#737373',
      positive: isDark ? '#d4d4d4' : '#404040',
      negative: isDark ? '#fafafa' : '#171717',
      pie: isDark ? NOTHING_PIE_DARK : NOTHING_PIE_LIGHT,
    };
  }

  const isDark = resolvedTheme === 'dark';
  return {
    grid: isDark ? '#1e293b' : '#f1f5f9',
    axis: '#94a3b8',
    label: isDark ? '#94a3b8' : '#64748b',
    barPrimary: '#94a3b8',
    barSecondary: isDark ? '#64748b' : '#cbd5e1',
    tooltip: {
      backgroundColor: isDark ? '#0f172a' : 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
      boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
    },
    neutral: isDark ? '#94a3b8' : '#64748b',
    positive: isDark ? '#34d399' : '#10b981',
    negative: isDark ? '#f87171' : '#ef4444',
    pie: DEFAULT_PIE,
  };
}
