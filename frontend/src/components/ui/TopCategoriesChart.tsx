/**
 * TopCategoriesChart: Horizontal bar chart showing top categories with trend indicators
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

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

const TopCategoriesChart: React.FC<TopCategoriesChartProps> = ({
  data,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-light">No data available</p>
      </div>
    );
  }

  // Sort by current amount descending
  const sortedData = [...data].sort((a, b) => b.current_amount - a.current_amount);

  // Format data for chart
  const chartData = sortedData.map(item => ({
    category: item.category,
    amount: item.current_amount,
    trend: item.trend_percentage,
    trendDirection: item.trend_direction
  }));

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return '#ef4444'; // red
      case 'down':
        return '#10b981'; // green
      default:
        return '#64748b'; // gray
    }
  };

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

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 100, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            style={{ fontSize: '11px', fontWeight: 300 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#94a3b8"
            style={{ fontSize: '11px', fontWeight: 300 }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}
          />
          <Bar dataKey="amount" fill="#94a3b8" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#94a3b8" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Trend indicators */}
      <div className="mt-8 space-y-3">
        {sortedData.map((item, index) => (
          <div
            key={item.category}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-slate-600 dark:text-slate-400 font-light">
                {index + 1}. {item.category}
              </span>
              <div
                className={`flex items-center gap-1 ${
                  item.trend_direction === 'up'
                    ? 'text-red-500 dark:text-red-400'
                    : item.trend_direction === 'down'
                    ? 'text-green-500 dark:text-green-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {getTrendIcon(item.trend_direction)}
                <span className="text-xs font-light">
                  {item.trend_percentage > 0 ? '+' : ''}
                  {item.trend_percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-light">
              {formatCurrency(item.current_amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCategoriesChart;

