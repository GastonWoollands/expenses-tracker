/**
 * FixedExpenseForm: Form for creating/editing fixed expenses
 */

import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, FormField, Input, CategorySearchSelect } from '../index';
import { ALL_CATEGORIES } from '../../config/categories';
import { useUserCategories } from '../../hooks/useUserCategories';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '../../services/api';
import { Calendar, Coins, FileText, Tag, Repeat } from 'lucide-react';

interface FixedExpenseFormProps {
  fixedExpense?: FixedExpense | null;
  onSubmit: (data: FixedExpenseCreate | FixedExpenseUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type FormState = {
  category: string;
  amount: string;
  day_of_month: string;
  description: string;
};

const initialState: FormState = {
  category: '',
  amount: '',
  day_of_month: '',
  description: '',
};

const FixedExpenseForm: React.FC<FixedExpenseFormProps> = ({
  fixedExpense,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string>('');
  const { categories: userCategories } = useUserCategories();

  useEffect(() => {
    if (fixedExpense) {
      // Find category key from category name - check both ALL_CATEGORIES and userCategories
      const categoryInfo = ALL_CATEGORIES.find(c => c.label === fixedExpense.category_name) ||
                          userCategories.find(c => c.name === fixedExpense.category_name);
      setForm({
        category: categoryInfo?.key || '',
        amount: fixedExpense.amount.toString(),
        day_of_month: fixedExpense.day_of_month.toString(),
        description: fixedExpense.description || '',
      });
    } else {
      setForm(initialState);
    }
  }, [fixedExpense, userCategories]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    // If category is selected from dropdown, it's valid (dropdown only shows valid categories)
    if (!form.category || form.category.trim() === '') {
      return 'Please choose a category.';
    }
    if (!form.amount) {
      return 'Please enter an amount.';
    }
    const amount = Number(form.amount);
    if (!isFinite(amount) || amount <= 0) {
      return 'Amount must be a positive number.';
    }
    if (!form.day_of_month) {
      return 'Please enter a day of month.';
    }
    const day = Number(form.day_of_month);
    if (!isFinite(day) || day < 1 || day > 31) {
      return 'Day of month must be between 1 and 31.';
    }
    if (!form.description.trim()) {
      return 'Please enter a description.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Find category name from either ALL_CATEGORIES or userCategories
      const allCat = ALL_CATEGORIES.find(c => c.key === form.category);
      const userCat = userCategories.find(c => c.key === form.category);
      const categoryName = allCat?.label || userCat?.name || form.category;
      
      const formData = {
        category: categoryName,
        amount: Number(form.amount),
        day_of_month: Number(form.day_of_month),
        description: form.description.trim(),
      };

      await onSubmit(formData);
      if (!fixedExpense) {
        setForm(initialState);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save fixed expense');
    }
  };

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {fixedExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
          </h3>
        </div>

        <FormField label="Category" htmlFor="category">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-500 dark:text-purple-400 z-10">
              <Tag className="h-5 w-5" />
            </div>
            <CategorySearchSelect
              value={form.category}
              onChange={(value) => updateField('category', value)}
              placeholder="Select category"
              className="pl-10"
              required
            />
          </div>
        </FormField>

        <FormField label="Amount" htmlFor="amount">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-500 dark:text-green-400 z-10">
              <Coins className="h-5 w-5" />
            </div>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField label="Day of Month" htmlFor="day_of_month">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500 dark:text-blue-400 z-10">
              <Calendar className="h-5 w-5" />
            </div>
            <Input
              id="day_of_month"
              name="day_of_month"
              type="number"
              min="1"
              max="31"
              required
              placeholder="1-31"
              value={form.day_of_month}
              onChange={(e) => updateField('day_of_month', e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The day of the month when this expense will be applied (1-31)
          </p>
        </FormField>

        <FormField label="Description / Notes" htmlFor="description">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500 dark:text-orange-400 z-10">
              <FileText className="h-5 w-5" />
            </div>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Add notes about this fixed expense"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </FormField>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {fixedExpense ? 'Update' : 'Create'} Fixed Expense
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default FixedExpenseForm;

