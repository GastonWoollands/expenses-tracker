/**
 * SpendingTrendChart: Line chart showing monthly spending trends
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';

interface TrendData {
  month: string;
  total_amount: number;
  count: number;
}

interface SpendingTrendChartProps {
  data: TrendData[];
  className?: string;
}

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data, className = '' }) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const previousAmount = index > 0 ? data[index - 1].total_amount : null;
      const change =
        previousAmount !== null && previousAmount > 0
          ? ((item.total_amount - previousAmount) / previousAmount) * 100
          : null;

      return {
        month: item.month,
        amount: item.total_amount,
        count: item.count,
        previousAmount,
        change,
        changeDirection:
          change !== null ? (change > 0 ? 'up' : change < 0 ? 'down' : 'stable') : null,
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-fg-muted text-sm font-light">No data available</p>
      </div>
    );
  }

  const tooltipStyle = { ...pal.tooltip };
  const dotStroke = resolvedTheme === 'dark' ? '#0f172a' : '#ffffff';
  const nothingDotStroke = resolvedTheme === 'dark' ? '#0a0a0a' : '#fafafa';
  const circleStroke = visualTheme === 'nothing' ? nothingDotStroke : dotStroke;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={pal.grid} strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            stroke={pal.axis}
            style={{ fontSize: '11px', fontWeight: 300 }}
            tickFormatter={(value) => {
              const [year, month] = value.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }}
          />
          <YAxis
            stroke={pal.axis}
            style={{ fontSize: '11px', fontWeight: 300 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string, props: any) => {
              if (name === 'amount') {
                const change = props.payload.change;
                const changeText =
                  change !== null ? ` (${change > 0 ? '+' : ''}${change.toFixed(1)}%)` : '';
                return [formatCurrency(value) + changeText, 'Total Spending'];
              }
              return [formatCurrency(value), name];
            }}
            labelFormatter={(label) => label}
            labelStyle={{ fontSize: '11px', fontWeight: 500, color: pal.label }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke={pal.neutral}
            strokeWidth={1.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const change = payload.change;
              const color =
                change !== null
                  ? change > 0
                    ? pal.negative
                    : change < 0
                      ? pal.positive
                      : pal.neutral
                  : pal.neutral;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={4} fill={color} stroke={circleStroke} strokeWidth={1} />
                </g>
              );
            }}
            activeDot={{ r: 5, stroke: pal.neutral, strokeWidth: 1 }}
            name="Total Spending"
          />
        </LineChart>
      </ResponsiveContainer>

      {chartData.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xs font-normal text-fg-muted mb-4 uppercase tracking-wide">
            Month-by-Month Comparison
          </h4>
          <div className="space-y-2">
            {chartData.map((item) => {
              const change = item.change;
              const hasChange = change !== null;
              const isIncrease = hasChange && change > 0;
              const isDecrease = hasChange && change < 0;
              const isStable = hasChange && change === 0;

              const [year, month] = item.month.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

              return (
                <div
                  key={item.month}
                  className="flex items-center justify-between py-2 border-b border-divider last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-light text-fg-muted w-24">{monthName}</span>
                    <span className="text-sm font-light text-fg">{formatCurrency(item.amount)}</span>
                  </div>
                  {hasChange && (
                    <div
                      className={`flex items-center gap-1 text-xs font-light ${
                        isIncrease
                          ? 'text-red-500 dark:text-red-400'
                          : isDecrease
                            ? 'text-green-500 dark:text-green-400'
                            : 'text-fg-muted'
                      }`}
                    >
                      {isIncrease && <TrendingUp className="w-3 h-3" />}
                      {isDecrease && <TrendingDown className="w-3 h-3" />}
                      {isStable && <Minus className="w-3 h-3" />}
                      <span>
                        {change > 0 ? '+' : ''}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {!hasChange && <span className="text-xs font-light text-fg-muted">Baseline</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingTrendChart;
