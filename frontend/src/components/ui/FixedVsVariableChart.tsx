/**
 * FixedVsVariableChart: Bar/Pie chart comparing fixed vs variable expenses
 */

import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface FixedVsVariableData {
  fixed: { amount: number; count: number; percentage: number };
  variable: { amount: number; count: number; percentage: number };
}

interface FixedVsVariableChartProps {
  data: FixedVsVariableData;
  type?: 'pie' | 'bar';
  className?: string;
}

const COLORS = ['#64748b', '#cbd5e1'];

const FixedVsVariableChart: React.FC<FixedVsVariableChartProps> = ({
  data,
  type = 'bar',
  className = ''
}) => {
  const chartData = [
    {
      type: 'Fixed',
      amount: data.fixed.amount,
      count: data.fixed.count,
      percentage: data.fixed.percentage
    },
    {
      type: 'Variable',
      amount: data.variable.amount,
      count: data.variable.count,
      percentage: data.variable.percentage
    }
  ];

  const total = data.fixed.amount + data.variable.amount;

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-80 ${className}`}>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-light">No data available</p>
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
              fill="#8884d8"
              dataKey="amount"
            >
              {chartData.map((_entry, index) => (
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
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 300 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Bar chart (default)
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
          <XAxis
            dataKey="type"
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
          <Bar dataKey="amount" fill="#94a3b8" radius={[0, 0, 0, 0]}>
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary */}
      <div className="mt-6 flex gap-8 justify-center text-sm">
        <div className="text-center">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-light mb-1">Fixed</div>
          <div className="text-slate-900 dark:text-slate-100 font-light">{formatCurrency(data.fixed.amount)}</div>
          <div className="text-slate-400 dark:text-slate-500 text-xs font-light mt-1">{data.fixed.percentage.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-light mb-1">Variable</div>
          <div className="text-slate-900 dark:text-slate-100 font-light">{formatCurrency(data.variable.amount)}</div>
          <div className="text-slate-400 dark:text-slate-500 text-xs font-light mt-1">{data.variable.percentage.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};

export default FixedVsVariableChart;

