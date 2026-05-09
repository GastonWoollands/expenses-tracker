/**
 * TopCategoriesChart: Dot plot + detail table — trends vs prior period
 */

import React, { useMemo } from 'react';
import {
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';

interface TopCategoryData {
  category: string;
  current_amount: number;
  previous_amount: number;
  count: number;
  trend_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
}

interface TopCategoriesChartProps {
  data: TopCategoryData[];
  className?: string;
}

function trendDotColor(direction: TopCategoryData['trend_direction'], pal: ReturnType<typeof getChartPalette>): string {
  if (direction === 'up') return pal.negative;
  if (direction === 'down') return pal.positive;
  return pal.neutral;
}

const TopCategoriesChart: React.FC<TopCategoriesChartProps> = ({ data, className = '' }) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  const sortedData = useMemo(() => [...data].sort((a, b) => b.current_amount - a.current_amount), [data]);

  const chartData = useMemo(
    () =>
      sortedData.map((item) => ({
        category: item.category,
        amount: item.current_amount,
        trend: item.trend_percentage,
        trendDirection: item.trend_direction,
        fill: trendDotColor(item.trend_direction, pal),
      })),
    [sortedData, pal],
  );

  const tooltipStyle = { ...pal.tooltip };
  const chartHeight = Math.min(420, Math.max(200, 36 + chartData.length * 24));

  const getTrendIcon = (direction: TopCategoryData['trend_direction']) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />;
      case 'down':
        return <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />;
      default:
        return <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />;
    }
  };

  if (data.length === 0) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface-raised ${className}`}>
        <p className="text-sm font-light text-fg-muted">No category trends for this period.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      <p className="text-sm font-light leading-relaxed text-fg-muted">
        Dots show current spend per category; color hints at change vs the previous window (up = higher spend, down = lower). Use the
        table for exact numbers.
      </p>

      <div className="flex flex-wrap gap-4 border-b border-border pb-3 text-xs font-light text-fg-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: pal.negative }} aria-hidden />
          Spending up vs prior
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: pal.positive }} aria-hidden />
          Spending down vs prior
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: pal.neutral }} aria-hidden />
          Roughly flat
        </span>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-3 shadow-[var(--shadow-card)] sm:p-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart data={chartData} margin={{ top: 6, right: 12, left: 4, bottom: 6 }}>
            <CartesianGrid
              stroke={pal.grid}
              strokeDasharray="3 3"
              strokeOpacity={visualTheme === 'nothing' ? 0.35 : 0.45}
            />
            <XAxis
              type="number"
              dataKey="amount"
              stroke={pal.axis}
              style={{ fontSize: '11px', fontWeight: 400 }}
              tickFormatter={(v) => formatCurrency(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="category"
              stroke={pal.axis}
              style={{ fontSize: '11px', fontWeight: 400 }}
              width={108}
              tickMargin={4}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: pal.grid }}
              contentStyle={tooltipStyle}
              formatter={(value: number, _name, item: { payload?: { trend?: number } }) => {
                const t = item.payload?.trend;
                const extra =
                  t !== undefined ? ` (${t > 0 ? '+' : ''}${Number(t).toFixed(1)}% vs prior)` : '';
                return [`${formatCurrency(value)}${extra}`, 'Current'];
              }}
              labelStyle={{ fontSize: '11px', fontWeight: 600, color: pal.label }}
            />
            <Scatter data={chartData} dataKey="amount" shape="circle">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.category}-${index}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted/80">
            <tr>
              <th className="px-3 py-2.5 font-medium text-fg-muted">#</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Category</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">This period</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Prior period</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Change</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-raised">
            {sortedData.map((item, index) => (
              <tr key={item.category} className="transition-colors hover:bg-surface-hover/60">
                <td className="px-3 py-2.5 tabular-nums text-fg-muted">{index + 1}</td>
                <td className="px-3 py-2.5 font-medium text-fg">{item.category}</td>
                <td className="px-3 py-2.5 tabular-nums text-fg">{formatCurrency(item.current_amount)}</td>
                <td className="px-3 py-2.5 tabular-nums text-fg-muted">{formatCurrency(item.previous_amount)}</td>
                <td className="px-3 py-2.5">
                  <div
                    className={`inline-flex items-center gap-1.5 tabular-nums ${
                      item.trend_direction === 'up'
                        ? 'text-red-600 dark:text-red-400'
                        : item.trend_direction === 'down'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-fg-muted'
                    }`}
                  >
                    {getTrendIcon(item.trend_direction)}
                    <span className="text-xs font-medium">
                      {item.trend_percentage > 0 ? '+' : ''}
                      {item.trend_percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-fg-muted">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopCategoriesChart;
