/**
 * SpendingTrendChart: Line chart showing monthly spending trends
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendData {
  month: string;
  total_amount: number;
  count: number;
}

interface SpendingTrendChartProps {
  data: TrendData[];
  className?: string;
}

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  className = ''
}) => {
  // Format data for chart with month-over-month comparison
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const previousAmount = index > 0 ? data[index - 1].total_amount : null;
      const change = previousAmount !== null && previousAmount > 0
        ? ((item.total_amount - previousAmount) / previousAmount) * 100
        : null;
      
      return {
        month: item.month,
        amount: item.total_amount,
        count: item.count,
        previousAmount,
        change,
        changeDirection: change !== null 
          ? (change > 0 ? 'up' : change < 0 ? 'down' : 'stable')
          : null
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-light">No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            style={{ fontSize: '11px', fontWeight: 300 }}
            tickFormatter={(value) => {
              // Format as "MMM YYYY"
              const [year, month] = value.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '11px', fontWeight: 300 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === 'amount') {
                const change = props.payload.change;
                const changeText = change !== null 
                  ? ` (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`
                  : '';
                return [formatCurrency(value) + changeText, 'Total Spending'];
              }
              return [formatCurrency(value), name];
            }}
            labelFormatter={(label) => label}
            labelStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#64748b"
            strokeWidth={1.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const change = payload.change;
              const color = change !== null
                ? (change > 0 ? '#ef4444' : change < 0 ? '#10b981' : '#64748b')
                : '#64748b';
              return (
                <g>
                  <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1} />
                </g>
              );
            }}
            activeDot={{ r: 5, stroke: '#64748b', strokeWidth: 1 }}
            name="Total Spending"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Month-by-Month Comparison Table */}
      {chartData.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
            Month-by-Month Comparison
          </h4>
          <div className="space-y-2">
            {chartData.map((item, index) => {
              const change = item.change;
              const hasChange = change !== null;
              const isIncrease = hasChange && change > 0;
              const isDecrease = hasChange && change < 0;
              const isStable = hasChange && change === 0;
              
              // Format month name
              const [year, month] = item.month.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              
              return (
                <div
                  key={item.month}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-light text-slate-600 dark:text-slate-400 w-24">
                      {monthName}
                    </span>
                    <span className="text-sm font-light text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  {hasChange && (
                    <div className={`flex items-center gap-1 text-xs font-light ${
                      isIncrease
                        ? 'text-red-500 dark:text-red-400'
                        : isDecrease
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {isIncrease && <TrendingUp className="w-3 h-3" />}
                      {isDecrease && <TrendingDown className="w-3 h-3" />}
                      {isStable && <Minus className="w-3 h-3" />}
                      <span>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {!hasChange && (
                    <span className="text-xs font-light text-slate-400 dark:text-slate-500">
                      Baseline
                    </span>
                  )}
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

