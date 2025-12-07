/**
 * FixedExpenseList: Display list of fixed expenses
 */

import React from 'react';
import { Card } from '../index';
import type { FixedExpense } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Edit2, Trash2, Repeat, Calendar, Coins, Tag, FileText, CheckCircle, XCircle } from 'lucide-react';

interface FixedExpenseListProps {
  fixedExpenses: FixedExpense[];
  onEdit: (fixedExpense: FixedExpense) => void;
  onDelete: (fixedExpense: FixedExpense) => void;
  isLoading?: boolean;
}

const FixedExpenseList: React.FC<FixedExpenseListProps> = ({
  fixedExpenses,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading fixed expenses...</p>
        </div>
      </Card>
    );
  }

  if (fixedExpenses.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Repeat className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Fixed Expenses
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create your first fixed expense to get started. Fixed expenses will automatically create transactions each month.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fixedExpenses.map((fixedExpense) => (
        <Card key={fixedExpense.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {fixedExpense.category_name}
                </h3>
                {fixedExpense.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(fixedExpense.amount)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">Day:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fixedExpense.day_of_month}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fixedExpense.currency}
                  </span>
                </div>
              </div>

              {fixedExpense.description && (
                <div className="flex items-start gap-2 mt-3 text-sm">
                  <FileText className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 dark:text-gray-400">{fixedExpense.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onEdit(fixedExpense)}
                className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Edit fixed expense"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(fixedExpense)}
                className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Delete fixed expense"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FixedExpenseList;

