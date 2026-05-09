/**
 * TopCategoriesChart: Horizontal bar chart showing top categories with trend indicators
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

const TopCategoriesChart: React.FC<TopCategoriesChartProps> = ({ data, className = '' }) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-fg-muted text-sm font-light">No data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.current_amount - a.current_amount);

  const chartData = sortedData.map((item) => ({
    category: item.category,
    amount: item.current_amount,
    trend: item.trend_percentage,
    trendDirection: item.trend_direction,
  }));

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const tooltipStyle = { ...pal.tooltip };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 100, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={pal.grid} strokeOpacity={0.5} />
          <XAxis
            type="number"
            stroke={pal.axis}
            style={{ fontSize: '11px', fontWeight: 300 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke={pal.axis}
            style={{ fontSize: '11px', fontWeight: 300 }}
            width={90}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ fontSize: '11px', fontWeight: 500, color: pal.label }}
          />
          <Bar dataKey="amount" radius={[0, 0, 0, 0]}>
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={pal.barPrimary} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8 space-y-3">
        {sortedData.map((item, index) => (
          <div key={item.category} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-fg-muted font-light">
                {index + 1}. {item.category}
              </span>
              <div
                className={`flex items-center gap-1 ${
                  item.trend_direction === 'up'
                    ? 'text-red-500 dark:text-red-400'
                    : item.trend_direction === 'down'
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-fg-muted'
                }`}
              >
                {getTrendIcon(item.trend_direction)}
                <span className="text-xs font-light">
                  {item.trend_percentage > 0 ? '+' : ''}
                  {item.trend_percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-fg-muted font-light">{formatCurrency(item.current_amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCategoriesChart;
