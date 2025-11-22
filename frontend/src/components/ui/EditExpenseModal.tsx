/**
 * Edit Expense Modal: Clean modal for editing expenses
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Coins, FileText, Tag } from 'lucide-react';
import { Button, Input, FormField, CategorySearchSelect, Alert } from '../index';
import type { Expense, ExpenseUpdate } from '../../services/api';
import { ALL_CATEGORIES } from '../../config/categories';

interface EditExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: ExpenseUpdate) => Promise<void>;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    date: '',
    amount: '',
    category: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (expense && isOpen) {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Find category key from label
      const categoryInfo = ALL_CATEGORIES.find(
        c => c.label === expense.category || c.key === expense.category
      );
      
      setForm({
        date: `${year}-${month}-${day}`,
        amount: expense.amount.toString(),
        category: categoryInfo?.key || expense.category,
        description: expense.description,
      });
      setError('');
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const updateField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.date) return 'Please select a date.';
    if (!form.amount) return 'Please enter an amount.';
    const n = Number(form.amount);
    if (!isFinite(n) || n <= 0) return 'Amount must be a positive number.';
    if (!form.category) return 'Please choose a category.';
    if (!form.description.trim()) return 'Please enter a description.';
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

    setSubmitting(true);
    try {
      const categoryInfo = ALL_CATEGORIES.find(c => c.key === form.category);
      
      // Ensure date is in ISO format (YYYY-MM-DDTHH:mm:ss)
      // FastAPI expects ISO 8601 format
      let dateValue: string;
      if (form.date.includes('T')) {
        dateValue = form.date;
      } else {
        // Add time component for ISO format
        dateValue = `${form.date}T00:00:00`;
      }
      
      // Validate amount
      const amountValue = Number(form.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Amount must be a positive number');
      }
      
      const updates: ExpenseUpdate = {
        date: dateValue,
        amount: amountValue,
        category: categoryInfo?.label || form.category,
        description: form.description.trim(),
      };
      
      console.log('EditExpenseModal: Sending update request:', { 
        id: expense.id, 
        updates,
        dateValue,
        amountValue,
        category: updates.category
      });
      
      await onSave(expense.id, updates);
      // Only close on success - onSave will throw if there's an error
      onClose();
    } catch (err: any) {
      console.error('Error in EditExpenseModal:', err);
      setError(err?.message || 'Failed to update expense. Please check your connection and try again.');
      // Don't close modal on error - let user see the error and retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50 flex flex-col max-h-[90vh]">
          {/* Header - Always visible */}
          <div className="flex items-center justify-between px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Expense
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-4 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4" id="edit-expense-form">
              <FormField label="Date" htmlFor="edit-date">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500 dark:text-blue-400 z-10">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <Input
                    id="edit-date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Amount" htmlFor="edit-amount">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-500 dark:text-green-400 z-10">
                    <Coins className="h-5 w-5" />
                  </div>
                  <Input
                    id="edit-amount"
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

              <FormField label="Category" htmlFor="edit-category">
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

              <FormField label="Description" htmlFor="edit-description">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500 dark:text-orange-400 z-10">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Input
                    id="edit-description"
                    type="text"
                    placeholder="Add a short note"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </FormField>

              {error && <Alert variant="error">{error}</Alert>}
            </form>
          </div>

          {/* Footer with buttons - Always visible */}
          <div className="px-4 pt-4 pb-4 sm:px-6 sm:pt-4 sm:pb-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-expense-form"
                isLoading={submitting}
                disabled={submitting}
                className="flex-1 min-w-[100px]"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;

