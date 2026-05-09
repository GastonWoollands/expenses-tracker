/**
 * Fixed Expenses page: recurring monthly expenses (layout aligned with Dashboard)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, Heading, Alert, Button, Toast } from '../components';
import FixedExpenseForm from '../components/ui/FixedExpenseForm';
import FixedExpenseList from '../components/ui/FixedExpenseList';
import { apiService } from '../services/api';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '../services/api';
import { Plus, Repeat, LayoutDashboard } from 'lucide-react';

const FixedExpenses: React.FC = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FixedExpense | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const fetchFixedExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getFixedExpenses();
      setFixedExpenses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load fixed expenses';
      setError(message);
      setFixedExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFixedExpenses();
  }, [fetchFixedExpenses]);

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingDelete(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingDelete]);

  const handleSubmit = async (data: FixedExpenseCreate | FixedExpenseUpdate) => {
    try {
      setSubmitting(true);
      setError('');

      if (editingExpense) {
        await apiService.updateFixedExpense(editingExpense.id, data as FixedExpenseUpdate);
        setToast({ message: 'Fixed expense updated.', type: 'success' });
      } else {
        await apiService.createFixedExpense(data as FixedExpenseCreate);
        setToast({ message: 'Fixed expense created.', type: 'success' });
      }

      await fetchFixedExpenses();
      setShowForm(false);
      setEditingExpense(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save fixed expense';
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
  };

  const executePendingDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    try {
      await apiService.deleteFixedExpense(target.id);
      setPendingDelete(null);
      setToast({ message: 'Fixed expense deleted.', type: 'success' });
      await fetchFixedExpenses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete fixed expense';
      setToast({ message, type: 'error' });
    }
  };

  const handleDeleteRequest = (fixedExpense: FixedExpense) => {
    setPendingDelete(fixedExpense);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
    setError('');
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
    setError('');
  };

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-10 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={2}>Fixed expenses</Heading>
            <p className="mt-2 max-w-xl text-sm font-light text-fg-muted">
              Recurring charges applied each month on the day you choose. They show up like other spending on your dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2 self-start sm:flex-row sm:items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg shadow-[var(--shadow-card)] transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
              Dashboard
            </Link>
            {!showForm && (
              <Button
                type="button"
                onClick={handleNewExpense}
                className="inline-flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Add fixed expense
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mx-auto w-full max-w-2xl">
            <FixedExpenseForm
              fixedExpense={editingExpense}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={submitting}
            />
          </div>
        )}

        {!showForm && (
          <>
            {error && <Alert variant="error">{error}</Alert>}

            <div className="max-h-[min(32rem,60svh)] overflow-y-auto overscroll-contain pr-1">
              <FixedExpenseList
                fixedExpenses={fixedExpenses}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                isLoading={loading}
              />
            </div>

            {!loading && fixedExpenses.length > 0 && (
              <div className="rounded-[var(--radius-card)] border border-accent-soft-border bg-accent-soft p-4 dark:bg-accent/10">
                <div className="flex items-start gap-3">
                  <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-fg">How fixed expenses work</h3>
                    <p className="text-sm font-light text-fg-muted leading-relaxed">
                      Each item runs on the day of the month you set and creates normal expense activity for that month. You can edit or pause entries anytime from this list.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fixed-delete-title"
            className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface-raised p-5 shadow-[var(--shadow-card)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="fixed-delete-title" className="text-base font-semibold text-fg">
              Delete fixed expense?
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              <span className="font-medium text-fg">{pendingDelete.category_name}</span> will be removed. This cannot be undone.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!bg-red-600 hover:!bg-red-700 focus-visible:ring-red-500"
                onClick={() => void executePendingDelete()}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ResponsiveContainer>
  );
};

export default FixedExpenses;
