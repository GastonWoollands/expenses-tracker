/**
 * CategoryChart: Pie/Bar chart showing category breakdown
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  type?: 'pie' | 'bar';
  onCategoryClick?: (category: string) => void;
  className?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  type = 'bar',
  onCategoryClick,
  className = '',
}) => {
  const { resolvedTheme, visualTheme } = useTheme();
  const pal = useMemo(() => getChartPalette(resolvedTheme, visualTheme), [resolvedTheme, visualTheme]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-fg-muted text-sm font-light">No data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.amount - a.amount);
  const tooltipStyle = { ...pal.tooltip };

  if (type === 'pie') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sortedData as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { payload } = props;
                return `${payload.category}: ${payload.percentage.toFixed(1)}%`;
              }}
              outerRadius={100}
              fill={pal.barPrimary}
              dataKey="amount"
              onClick={(entry: any) => {
                if (entry && entry.payload && onCategoryClick) {
                  onCategoryClick(entry.payload.category);
                }
              }}
              style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
            >
              {sortedData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={pal.pie[index % pal.pie.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ fontSize: '11px', fontWeight: 500, color: pal.label }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={pal.grid} strokeOpacity={0.5} />
          <XAxis
            dataKey="category"
            stroke={pal.axis}
            style={{ fontSize: '11px', fontWeight: 300 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
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
          <Bar
            dataKey="amount"
            fill={pal.barPrimary}
            radius={[0, 0, 0, 0]}
            onClick={(entry: any) => {
              if (entry && entry.payload && onCategoryClick) {
                onCategoryClick(entry.payload.category);
              }
            }}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
