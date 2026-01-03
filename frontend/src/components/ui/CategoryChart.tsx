/**
 * CategoryChart: Pie/Bar chart showing category breakdown
 */

import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

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

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  type = 'bar',
  onCategoryClick,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-light">No data available</p>
      </div>
    );
  }

  // Sort by amount descending
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  if (type === 'pie') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="amount"
              onClick={(data) => onCategoryClick && onCategoryClick(data.category)}
              style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
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
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Bar chart (default)
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
          <XAxis
            dataKey="category"
            stroke="#94a3b8"
            style={{ fontSize: '11px', fontWeight: 300 }}
            angle={-45}
            textAnchor="end"
            height={80}
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
          <Bar
            dataKey="amount"
            fill="#94a3b8"
            radius={[0, 0, 0, 0]}
            onClick={(data) => onCategoryClick && onCategoryClick(data.category)}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;

