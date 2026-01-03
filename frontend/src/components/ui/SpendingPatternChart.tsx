/**
 * SpendingPatternChart: Bar chart showing spending patterns by day of week and time of month
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface DayOfWeekData {
  day: string;
  dayIndex: number;
  total_amount: number;
  count: number;
  average: number;
}

interface TimeOfMonthData {
  period: string;
  total_amount: number;
  count: number;
  average: number;
}

interface SpendingPatternChartProps {
  dayOfWeekData?: DayOfWeekData[];
  timeOfMonthData?: TimeOfMonthData[];
  className?: string;
}

const SpendingPatternChart: React.FC<SpendingPatternChartProps> = ({
  dayOfWeekData,
  timeOfMonthData,
  className = ''
}) => {
  const hasData = (dayOfWeekData && dayOfWeekData.length > 0) || (timeOfMonthData && timeOfMonthData.length > 0);

  if (!hasData) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-light">No data available</p>
      </div>
    );
  }

  // Format day of week data
  const dayChartData = dayOfWeekData?.map(item => ({
    day: item.day.substring(0, 3), // Short day name
    total: item.total_amount,
    average: item.average
  })) || [];

  // Format time of month data
  const monthChartData = timeOfMonthData?.map(item => ({
    period: item.period.charAt(0).toUpperCase() + item.period.slice(1),
    total: item.total_amount,
    average: item.average
  })) || [];

  return (
    <div className={`space-y-10 ${className}`}>
      {dayChartData.length > 0 && (
        <div>
          <h4 className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wide">
            Spending by Day of Week
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dayChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                style={{ fontSize: '11px', fontWeight: 300 }}
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
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
              <Bar dataKey="total" fill="#94a3b8" name="Total Spending" radius={[0, 0, 0, 0]} />
              <Bar dataKey="average" fill="#cbd5e1" name="Average per Transaction" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthChartData.length > 0 && (
        <div>
          <h4 className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wide">
            Spending by Time of Month
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                style={{ fontSize: '11px', fontWeight: 300 }}
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
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
              <Bar dataKey="total" fill="#94a3b8" name="Total Spending" radius={[0, 0, 0, 0]} />
              <Bar dataKey="average" fill="#cbd5e1" name="Average per Transaction" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SpendingPatternChart;

