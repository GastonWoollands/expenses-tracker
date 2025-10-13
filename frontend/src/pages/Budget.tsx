/**
 * Budget Page: Clean, minimalist budget tracking interface
 * Displays income, expenses, remaining balance, and category budgets
 */

import React, { useState } from 'react';
import { ResponsiveContainer, Heading, Card } from '../components';
import BudgetSummaryCard from '../components/ui/BudgetSummaryCard';
import BudgetCategoryTable from '../components/ui/BudgetCategoryTable';
import MonthlyBudgetOverview from '../components/ui/MonthlyBudgetOverview';
import BudgetCategorySetup from '../components/ui/BudgetCategorySetup';
import { useBudgetData } from '../hooks/useBudgetData';
import { getCurrentMonthName, getCurrentYear } from '../utils/formatters';
import { Settings } from 'lucide-react';

const Budget: React.FC = () => {
  const { 
    budgetData, 
    loading, 
    error, 
    saveStatus,
    updateIncome, 
    updateCategoryBudget,
    refreshData
  } = useBudgetData();

  const [editingIncome, setEditingIncome] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showCategorySetup, setShowCategorySetup] = useState(false);

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="min-h-screen py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Budget
              </Heading>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Loading your budget overview...
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </Card>
              </div>
              <div className="space-y-4">
                <Card className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="min-h-screen py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Budget
              </Heading>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Unable to load budget data
              </p>
            </div>
            <Card className="p-6">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Error loading budget data: {error}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </Card>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="min-h-screen py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center">
            <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Budget
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Track your income, expenses, and budget goals for {getCurrentMonthName()} {getCurrentYear()}
            </p>
            
            {/* Save Status Indicator */}
            {saveStatus.saving && (
              <div className="mt-4 inline-flex items-center px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Saving...
              </div>
            )}
            
            {saveStatus.saved && (
              <div className="mt-4 inline-flex items-center px-3 py-2 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved successfully
              </div>
            )}
            
            {saveStatus.error && (
              <div className="mt-4 inline-flex items-center px-3 py-2 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {saveStatus.error}
              </div>
            )}
          </div>

          {/* Top-Level Summary */}
          <BudgetSummaryCard
            income={budgetData.income}
            totalExpenses={budgetData.totalExpenses}
            remainingBalance={budgetData.remainingBalance}
            editingIncome={editingIncome}
            onEditIncome={() => setEditingIncome(true)}
            onSaveIncome={(amount: number) => {
              updateIncome(amount);
              setEditingIncome(false);
            }}
            onCancelEdit={() => setEditingIncome(false)}
          />

          {/* Budget by Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Heading level={2} className="text-xl font-semibold text-gray-900 dark:text-white">
                Budget by Category
              </Heading>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {budgetData.categories.length} categories
                </p>
                <button
                  onClick={() => setShowCategorySetup(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Set Up Categories</span>
                </button>
              </div>
            </div>
            
            <BudgetCategoryTable
              categories={budgetData.categories}
              editingCategory={editingCategory}
              onEditCategory={(categoryId: string) => setEditingCategory(categoryId)}
              onSaveCategory={(categoryId: string, budget: number) => {
                updateCategoryBudget(categoryId, budget);
                setEditingCategory(null);
              }}
              onCancelEdit={() => setEditingCategory(null)}
            />
          </div>

          {/* Monthly Budget Overview */}
          <MonthlyBudgetOverview
            totalBudget={budgetData.totalBudget}
            totalExpenses={budgetData.totalExpenses}
            difference={budgetData.budgetDifference}
          />

          {/* Empty State */}
          {budgetData.categories.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Budget Categories Defined
                </Heading>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Set up budget limits for your expense categories to start tracking your spending goals.
                </p>
                <button 
                  onClick={() => setShowCategorySetup(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Set Up Budget Categories
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Budget Category Setup Modal */}
      <BudgetCategorySetup
        isOpen={showCategorySetup}
        onClose={() => setShowCategorySetup(false)}
        onSave={(categories) => {
          // Refresh budget data after saving
          refreshData();
        }}
        existingBudgets={budgetData.categories
          .filter(cat => cat.budget > 0)
          .map(cat => ({
            category_key: cat.id,
            amount: cat.budget
          }))}
      />
    </ResponsiveContainer>
  );
};

export default Budget;