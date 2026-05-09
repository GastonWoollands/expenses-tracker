/**
 * FixedVsVariableChart: Dot plot + comparison summary — no bar/pie
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

interface FixedVsVariableData {
  fixed: { amount: number; count: number; percentage: number };
  variable: { amount: number; count: number; percentage: number };
}

interface FixedVsVariableChartProps {
  data: FixedVsVariableData;
  className?: string;
}

const FixedVsVariableChart: React.FC<FixedVsVariableChartProps> = ({ data, className = '' }) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  const total = data.fixed.amount + data.variable.amount;
  const tooltipStyle = { ...pal.tooltip };

  const chartData = useMemo(
    () => [
      { label: 'Fixed', amount: data.fixed.amount, fill: pal.barPrimary, count: data.fixed.count },
      { label: 'Variable', amount: data.variable.amount, fill: pal.barSecondary, count: data.variable.count },
    ],
    [data.fixed.amount, data.fixed.count, data.variable.amount, data.variable.count, pal.barPrimary, pal.barSecondary],
  );

  if (total <= 0) {
    return (
      <div className={`flex h-56 items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface-raised ${className}`}>
        <p className="text-sm font-light text-fg-muted">No fixed or variable totals for this period.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      <p className="text-sm font-light leading-relaxed text-fg-muted">
        Fixed costs repeat on a schedule; variable costs change month to month.{' '}
        <span className="font-medium text-fg">
          {data.fixed.percentage.toFixed(0)}% fixed
        </span>
        ,{' '}
        <span className="font-medium text-fg">{data.variable.percentage.toFixed(0)}% variable</span>
        {' — '}
        <span className="tabular-nums text-fg">{formatCurrency(total)}</span> combined.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Fixed</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{formatCurrency(data.fixed.amount)}</p>
          <p className="mt-2 text-xs font-light text-fg-muted">
            {data.fixed.percentage.toFixed(1)}% of spending · {data.fixed.count} transactions
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Variable</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{formatCurrency(data.variable.amount)}</p>
          <p className="mt-2 text-xs font-light text-fg-muted">
            {data.variable.percentage.toFixed(1)}% of spending · {data.variable.count} transactions
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-3 shadow-[var(--shadow-card)] sm:p-4">
        <p className="mb-2 text-xs font-medium text-fg-muted">Amount scale (dots)</p>
        <ResponsiveContainer width="100%" height={140}>
          <ScatterChart data={chartData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
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
            <YAxis type="category" dataKey="label" stroke={pal.axis} style={{ fontSize: '11px' }} width={68} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: pal.grid }}
              contentStyle={tooltipStyle}
              formatter={(value: number, _n, item: { payload?: { count?: number } }) => [
                `${formatCurrency(value)} · ${item.payload?.count ?? 0} tx`,
                'Amount',
              ]}
              labelStyle={{ fontSize: '11px', fontWeight: 600, color: pal.label }}
            />
            <Scatter data={chartData} dataKey="amount" shape="circle">
              {chartData.map((row, i) => (
                <Cell key={`cell-${row.label}-${i}`} fill={row.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FixedVsVariableChart;
