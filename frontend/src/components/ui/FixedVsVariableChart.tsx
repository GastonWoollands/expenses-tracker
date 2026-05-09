/**
 * FixedVsVariableChart: Bar/Pie chart comparing fixed vs variable expenses
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';

interface FixedVsVariableData {
  fixed: { amount: number; count: number; percentage: number };
  variable: { amount: number; count: number; percentage: number };
}

interface FixedVsVariableChartProps {
  data: FixedVsVariableData;
  type?: 'pie' | 'bar';
  className?: string;
}

const FixedVsVariableChart: React.FC<FixedVsVariableChartProps> = ({
  data,
  type = 'bar',
  className = '',
}) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  const chartData = [
    {
      type: 'Fixed',
      amount: data.fixed.amount,
      count: data.fixed.count,
      percentage: data.fixed.percentage,
    },
    {
      type: 'Variable',
      amount: data.variable.amount,
      count: data.variable.count,
      percentage: data.variable.percentage,
    },
  ];

  const segmentColors = [pal.barPrimary, pal.barSecondary];
  const total = data.fixed.amount + data.variable.amount;
  const tooltipStyle = { ...pal.tooltip };

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-fg-muted text-sm font-light">No data available</p>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { payload } = props;
                return `${payload.type}: ${payload.percentage.toFixed(1)}%`;
              }}
              outerRadius={100}
              fill={pal.barPrimary}
              dataKey="amount"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={segmentColors[index % segmentColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ fontSize: '11px', fontWeight: 500, color: pal.label }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={pal.grid} strokeOpacity={0.5} />
          <XAxis dataKey="type" stroke={pal.axis} style={{ fontSize: '11px', fontWeight: 300 }} />
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
          <Bar dataKey="amount" radius={[0, 0, 0, 0]}>
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={segmentColors[index % segmentColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 flex gap-8 justify-center text-sm">
        <div className="text-center">
          <div className="text-fg-muted text-xs font-light mb-1">Fixed</div>
          <div className="text-fg font-light">{formatCurrency(data.fixed.amount)}</div>
          <div className="text-fg-muted text-xs font-light mt-1">{data.fixed.percentage.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-fg-muted text-xs font-light mb-1">Variable</div>
          <div className="text-fg font-light">{formatCurrency(data.variable.amount)}</div>
          <div className="text-fg-muted text-xs font-light mt-1">{data.variable.percentage.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};

export default FixedVsVariableChart;
