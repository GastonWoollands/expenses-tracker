/**
 * CategoryChart: Dot plot + table — spending by category (no bar/pie)
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
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';

interface CategoryData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  onCategoryClick?: (category: string) => void;
  className?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, onCategoryClick, className = '' }) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  const sortedData = useMemo(
    () =>
      [...data].sort((a, b) => b.amount - a.amount).map((row, i) => ({
        ...row,
        fill: pal.pie[i % pal.pie.length],
      })),
    [data, pal.pie],
  );

  const tooltipStyle = { ...pal.tooltip };
  const chartHeight = Math.min(480, Math.max(200, 40 + sortedData.length * 24));
  const totalAmount = sortedData.reduce((s, r) => s + r.amount, 0);

  if (data.length === 0) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface-raised ${className}`}>
        <p className="text-sm font-light text-fg-muted">No data for this period.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      <p className="text-sm font-light leading-relaxed text-fg-muted">
        Dots show each category&apos;s share of spending in your selected range.{' '}
        <span className="text-fg tabular-nums">{formatCurrency(totalAmount)}</span> total across{' '}
        <span className="text-fg">{sortedData.length}</span> categories.
      </p>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-3 shadow-[var(--shadow-card)] sm:p-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart data={sortedData} margin={{ top: 6, right: 12, left: 4, bottom: 6 }}>
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
              width={112}
              tickMargin={4}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: pal.grid }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
              labelFormatter={(label) => String(label)}
              labelStyle={{ fontSize: '11px', fontWeight: 600, color: pal.label }}
            />
            <Scatter
              data={sortedData}
              dataKey="amount"
              shape="circle"
              style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
              onClick={(pt: { category?: string }) => {
                if (onCategoryClick && pt?.category) onCategoryClick(pt.category);
              }}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${entry.category}-${index}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted/80">
            <tr>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Category</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Amount</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Share</th>
              <th className="px-3 py-2.5 font-medium text-fg-muted">Transactions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-raised">
            {sortedData.map((row) => (
              <tr key={row.category} className="transition-colors hover:bg-surface-hover/60">
                <td className="px-3 py-2.5 font-medium text-fg">{row.category}</td>
                <td className="px-3 py-2.5 tabular-nums text-fg">{formatCurrency(row.amount)}</td>
                <td className="px-3 py-2.5 tabular-nums text-fg-muted">{row.percentage.toFixed(1)}%</td>
                <td className="px-3 py-2.5 tabular-nums text-fg-muted">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryChart;
