/**
 * BudgetSummaryCard: Clean summary of income, expenses, and remaining balance
 */

import React, { useState } from 'react';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, TrendingUp, TrendingDown, Edit3, Check, X } from 'lucide-react';

interface BudgetSummaryCardProps {
  income: number;
  totalExpenses: number;
  remainingBalance: number;
  editingIncome: boolean;
  onEditIncome: () => void;
  onSaveIncome: (amount: number) => void;
  onCancelEdit: () => void;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  income,
  totalExpenses,
  remainingBalance,
  editingIncome,
  onEditIncome,
  onSaveIncome,
  onCancelEdit
}) => {
  const [tempIncome, setTempIncome] = useState(income.toString());

  const handleSave = () => {
    const amount = parseFloat(tempIncome);
    if (!isNaN(amount) && amount >= 0) {
      onSaveIncome(amount);
    }
  };

  const handleCancel = () => {
    setTempIncome(income.toString());
    onCancelEdit();
  };

  const isOverBudget = remainingBalance < 0;
  const isNearBudget = remainingBalance >= 0 && remainingBalance < (income * 0.1); // Less than 10% remaining

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Monthly Income */}
      <Card className="p-6 hover:shadow-md transition-shadow duration-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">
              Monthly Income
            </h3>
            {!editingIncome && (
              <button
                onClick={onEditIncome}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {editingIncome ? (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-500 dark:text-green-400 z-10">
                  <DollarSign className="h-5 w-5" />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempIncome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempIncome(e.target.value)}
                  className="pl-10"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  className="flex-1 text-sm py-2"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {formatCurrency(income)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Per month
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Total Expenses */}
      <Card className="p-6 hover:shadow-md transition-shadow duration-200">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">
            Total Expenses
          </h3>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              This month
            </p>
          </div>
        </div>
      </Card>

      {/* Remaining Balance */}
      <Card className={`p-6 hover:shadow-md transition-shadow duration-200 ${
        isOverBudget 
          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' 
          : isNearBudget 
            ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
            : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
      }`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">
              Remaining Balance
            </h3>
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
                  <TrendingUp className="w-3 h-3 mr-1" />
                  On Track
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className={`text-2xl font-bold tracking-tight ${
              isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : isNearBudget
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
            }`}>
              {formatCurrency(remainingBalance)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {isOverBudget ? 'Over budget' : isNearBudget ? 'Low balance' : 'Available'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BudgetSummaryCard;
