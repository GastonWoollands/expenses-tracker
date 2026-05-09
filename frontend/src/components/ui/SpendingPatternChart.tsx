/**
 * SpendingPatternChart: Bar chart showing spending patterns by day of week and time of month
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';

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
  className = '',
}) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  const hasData =
    (dayOfWeekData && dayOfWeekData.length > 0) || (timeOfMonthData && timeOfMonthData.length > 0);

  if (!hasData) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-fg-muted text-sm font-light">No data available</p>
      </div>
    );
  }

  const dayChartData =
    dayOfWeekData?.map((item) => ({
      day: item.day.substring(0, 3),
      total: item.total_amount,
      average: item.average,
    })) || [];

  const monthChartData =
    timeOfMonthData?.map((item) => ({
      period: item.period.charAt(0).toUpperCase() + item.period.slice(1),
      total: item.total_amount,
      average: item.average,
    })) || [];

  const tooltipStyle = { ...pal.tooltip };

  return (
    <div className={`space-y-10 ${className}`}>
      {dayChartData.length > 0 && (
        <div>
          <h4 className="text-xs font-normal text-fg-muted mb-6 uppercase tracking-wide">
            Spending by Day of Week
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dayChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={pal.grid} strokeOpacity={0.5} />
              <XAxis dataKey="day" stroke={pal.axis} style={{ fontSize: '11px', fontWeight: 300 }} />
              <YAxis
                stroke={pal.axis}
                style={{ fontSize: '11px', fontWeight: 300 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ fontSize: '11px', fontWeight: 500, color: pal.label }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
              <Bar dataKey="total" fill={pal.barPrimary} name="Total Spending" radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="average"
                fill={pal.barSecondary}
                name="Average per Transaction"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthChartData.length > 0 && (
        <div>
          <h4 className="text-xs font-normal text-fg-muted mb-6 uppercase tracking-wide">
            Spending by Time of Month
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={pal.grid} strokeOpacity={0.5} />
              <XAxis dataKey="period" stroke={pal.axis} style={{ fontSize: '11px', fontWeight: 300 }} />
              <YAxis
                stroke={pal.axis}
                style={{ fontSize: '11px', fontWeight: 300 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ fontSize: '11px', fontWeight: 500, color: pal.label }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
              <Bar dataKey="total" fill={pal.barPrimary} name="Total Spending" radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="average"
                fill={pal.barSecondary}
                name="Average per Transaction"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SpendingPatternChart;
