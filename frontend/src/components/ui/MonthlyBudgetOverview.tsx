/**
 * MonthlyBudgetOverview: Compact overview of total budget vs expenses
 */

import React from 'react';
import Card from '../Card';
import Heading from './Heading';
import { formatCurrency } from '../../utils/formatters';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyBudgetOverviewProps {
  totalBudget: number;
  totalExpenses: number;
  difference: number;
}

const MonthlyBudgetOverview: React.FC<MonthlyBudgetOverviewProps> = ({
  totalBudget,
  totalExpenses,
  difference
}) => {
  const isOverBudget = difference < 0;
  const isNearBudget = difference >= 0 && difference < (totalBudget * 0.1); // Less than 10% remaining
  const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Budget Overview
          </Heading>
          <div className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
            isOverBudget
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : isNearBudget
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {isOverBudget ? (
              <>
                <TrendingDown className="w-3 h-3 mr-1" />
                Over Budget
              </>
            ) : isNearBudget ? (
              <>
                <TrendingUp className="w-3 h-3 mr-1" />
                Near Limit
              </>
            ) : (
              <>
                <Target className="w-3 h-3 mr-1" />
                On Track
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Budget */}
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Budget
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalBudget)}
            </div>
          </div>

          {/* Total Expenses */}
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Expenses
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalExpenses)}
            </div>
          </div>

          {/* Difference */}
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {isOverBudget ? 'Over Budget' : 'Remaining'}
            </div>
            <div className={`text-xl font-bold ${
              isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : isNearBudget
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
            }`}>
              {formatCurrency(Math.abs(difference))}
            </div>
          </div>
        </div>

        {/* Budget Utilization Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Budget Utilization
            </span>
            <span className={`font-medium ${
              isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : isNearBudget
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
            }`}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>
          
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isOverBudget
                  ? 'bg-red-500'
                  : isNearBudget
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
            
            {/* Over-budget indicator */}
            {isOverBudget && (
              <div className="absolute inset-0 bg-red-200 dark:bg-red-800 opacity-30" />
            )}
            
            {/* 100% marker */}
            {budgetUtilization > 100 && (
              <div className="absolute top-0 left-full w-0.5 h-full bg-gray-400 dark:bg-gray-600" />
            )}
          </div>
        </div>

        {/* Summary Text */}
        <div className="text-center">
          <p className={`text-sm ${
            isOverBudget
              ? 'text-red-600 dark:text-red-400'
              : isNearBudget
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-green-600 dark:text-green-400'
          }`}>
            {isOverBudget ? (
              `You've exceeded your budget by ${formatCurrency(Math.abs(difference))}`
            ) : isNearBudget ? (
              `You have ${formatCurrency(difference)} remaining (${((difference / totalBudget) * 100).toFixed(1)}% of budget left)`
            ) : (
              `You have ${formatCurrency(difference)} remaining (${((difference / totalBudget) * 100).toFixed(1)}% of budget left)`
            )}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyBudgetOverview;
