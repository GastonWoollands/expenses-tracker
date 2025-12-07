/**
 * Fixed Expenses page: Manage recurring monthly expenses
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, Heading, Container, Alert, Button, Toast } from '../components';
import FixedExpenseForm from '../components/ui/FixedExpenseForm';
import FixedExpenseList from '../components/ui/FixedExpenseList';
import { apiService } from '../services/api';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '../services/api';
import { Plus, Repeat } from 'lucide-react';

const FixedExpenses: React.FC = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const fetchFixedExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getFixedExpenses();
      setFixedExpenses(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load fixed expenses');
      setFixedExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFixedExpenses();
  }, [fetchFixedExpenses]);

  const handleSubmit = async (data: FixedExpenseCreate | FixedExpenseUpdate) => {
    try {
      setSubmitting(true);
      setError('');
      
      if (editingExpense) {
        await apiService.updateFixedExpense(editingExpense.id, data as FixedExpenseUpdate);
        setSuccess('Fixed expense updated successfully');
      } else {
        await apiService.createFixedExpense(data as FixedExpenseCreate);
        setSuccess('Fixed expense created successfully');
      }
      
      setToast({ message: editingExpense ? 'Fixed expense updated successfully' : 'Fixed expense created successfully', type: 'success' });
      await fetchFixedExpenses();
      setShowForm(false);
      setEditingExpense(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save fixed expense';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (fixedExpense: FixedExpense) => {
    setEditingExpense(fixedExpense);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (fixedExpense: FixedExpense) => {
    if (!window.confirm(`Are you sure you want to delete the fixed expense "${fixedExpense.category_name}"?`)) {
      return;
    }

    try {
      await apiService.deleteFixedExpense(fixedExpense.id);
      setToast({ message: 'Fixed expense deleted successfully', type: 'success' });
      await fetchFixedExpenses();
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to delete fixed expense', type: 'error' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
    setError('');
    setSuccess('');
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="min-h-screen py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Fixed Expenses
              </Heading>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Manage recurring monthly expenses that are automatically applied each month
              </p>
            </div>
            {!showForm && (
              <Button onClick={handleNewExpense} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Fixed Expense
              </Button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <Container width="md">
              <FixedExpenseForm
                fixedExpense={editingExpense}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={submitting}
              />
            </Container>
          )}

          {/* List */}
          {!showForm && (
            <div>
              <FixedExpenseList
                fixedExpenses={fixedExpenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
              />
            </div>
          )}

          {/* Error/Success Messages */}
          {error && !showForm && (
            <Alert variant="error">{error}</Alert>
          )}
          {success && !showForm && (
            <Alert variant="success">{success}</Alert>
          )}

          {/* Info Card */}
          {!showForm && fixedExpenses.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Repeat className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    How Fixed Expenses Work
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Fixed expenses are automatically applied each month on the specified day. 
                    They create regular expense transactions that appear in your dashboard and expense lists.
                    You can manually apply fixed expenses for a specific month using the API endpoint.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ResponsiveContainer>
  );
};

export default FixedExpenses;

