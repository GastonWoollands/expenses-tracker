/**
 * BudgetCategoryTable: Responsive table showing budget status by category
 */

import React from 'react';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import CategoryProgressBar from './CategoryProgressBar';
import { formatCurrency } from '../../utils/formatters';
import { Edit3, Check, X } from 'lucide-react';

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

interface BudgetCategoryTableProps {
  categories: BudgetCategory[];
  editingCategory: string | null;
  onEditCategory: (categoryId: string) => void;
  onSaveCategory: (categoryId: string, budget: number) => void;
  onCancelEdit: () => void;
}

const BudgetCategoryTable: React.FC<BudgetCategoryTableProps> = ({
  categories,
  editingCategory,
  onEditCategory,
  onSaveCategory,
  onCancelEdit
}) => {
  // Sort categories by percentage used (descending)
  const sortedCategories = [...categories].sort((a, b) => b.percentageUsed - a.percentageUsed);

  if (categories.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Budget Categories
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Set up budget limits for your expense categories to track spending goals.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedCategories.map((category) => (
                <tr key={category.id} data-category={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        category.isOverBudget 
                          ? 'bg-red-500' 
                          : category.percentageUsed > 80 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`} />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory === category.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={category.budget}
                          className="w-24 text-sm"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                              const amount = parseFloat((e.target as HTMLInputElement).value);
                              if (!isNaN(amount) && amount >= 0) {
                                onSaveCategory(category.id, amount);
                              }
                            } else if (e.key === 'Escape') {
                              onCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          onClick={() => {
                            // Find the input field in the same row
                            const input = document.querySelector(`tr[data-category="${category.id}"] input[type="number"]`) as HTMLInputElement;
                            const amount = parseFloat(input?.value || category.budget.toString());
                            console.log('Save button clicked:', { categoryId: category.id, amount, inputValue: input?.value });
                            if (!isNaN(amount) && amount >= 0) {
                              console.log('Calling onSaveCategory with:', category.id, amount);
                              onSaveCategory(category.id, amount);
                            } else {
                              console.log('Invalid amount:', amount);
                            }
                          }}
                          className="p-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={onCancelEdit}
                          variant="secondary"
                          className="p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(category.budget)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(category.spent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      category.isOverBudget
                        ? 'text-red-600 dark:text-red-400'
                        : category.percentageUsed > 80
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                    }`}>
                      {category.percentageUsed.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CategoryProgressBar
                      percentage={category.percentageUsed}
                      isOverBudget={category.isOverBudget}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingCategory !== category.id && (
                      <button
                        onClick={() => onEditCategory(category.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {sortedCategories.map((category) => (
          <div key={category.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  category.isOverBudget 
                    ? 'bg-red-500' 
                    : category.percentageUsed > 80 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`} />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.name}
                </h3>
              </div>
              {editingCategory !== category.id && (
                <button
                  onClick={() => onEditCategory(category.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                {editingCategory === category.id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={category.budget}
                      className="w-20 text-sm"
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          const amount = parseFloat((e.target as HTMLInputElement).value);
                          if (!isNaN(amount) && amount >= 0) {
                            onSaveCategory(category.id, amount);
                          }
                        } else if (e.key === 'Escape') {
                          onCancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={() => {
                        const input = document.querySelector(`input[data-category="${category.id}"]`) as HTMLInputElement;
                        const amount = parseFloat(input?.value || category.budget.toString());
                        if (!isNaN(amount) && amount >= 0) {
                          onSaveCategory(category.id, amount);
                        }
                      }}
                      className="p-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={onCancelEdit}
                      variant="secondary"
                      className="p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(category.budget)}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Spent:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(category.spent)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">% Used:</span>
                <span className={`font-medium ${
                  category.isOverBudget
                    ? 'text-red-600 dark:text-red-400'
                    : category.percentageUsed > 80
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                }`}>
                  {category.percentageUsed.toFixed(1)}%
                </span>
              </div>

              <CategoryProgressBar
                percentage={category.percentageUsed}
                isOverBudget={category.isOverBudget}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BudgetCategoryTable;
