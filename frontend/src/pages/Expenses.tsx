/**
 * Expenses page: add a one-off expense (layout aligned with Dashboard)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, FormField, Heading, Input, CategorySearchSelect, ResponsiveContainer } from '../components';
import { ALL_CATEGORIES, CATEGORY_KEYS } from '../config/categories';
import { apiService } from '../services/api';
import { Calendar, Coins, FileText, Tag, LayoutDashboard } from 'lucide-react';

type ExpenseFormState = {
  date: string;
  amount: string;
  category: string;
  description: string;
};

const getToday = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialState: ExpenseFormState = {
  date: getToday(),
  amount: '',
  category: '',
  description: '',
};

const iconSlot = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted z-10';

const Expenses: React.FC = () => {
  const [form, setForm] = useState<ExpenseFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const updateField = (key: keyof ExpenseFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.date) return 'Please select a date.';
    if (!form.amount) return 'Please enter an amount.';
    const n = Number(form.amount);
    if (!isFinite(n) || n <= 0) return 'Amount must be a positive number.';
    if (!form.category || !CATEGORY_KEYS.includes(form.category)) return 'Please choose a valid category.';
    if (!form.description.trim()) return 'Please enter a description.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const categoryInfo = ALL_CATEGORIES.find((c) => c.key === form.category);
      await apiService.createExpense({
        date: form.date + 'T00:00:00',
        amount: Number(form.amount),
        category: categoryInfo?.label || form.category,
        description: form.description.trim(),
      });
      setSuccess('Expense saved.');
      setForm({ ...initialState, date: getToday() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save expense';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-10 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={2}>Add expense</Heading>
            <p className="mt-2 max-w-xl text-sm font-light text-fg-muted">
              Record a transaction. It will appear on your dashboard and in monthly totals.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-[var(--radius-control)] border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg shadow-[var(--shadow-card)] transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
            Dashboard
          </Link>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <FormField label="Date" htmlFor="date">
                <div className="relative">
                  <div className={iconSlot}>
                    <Calendar className="h-5 w-5" aria-hidden />
                  </div>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Amount" htmlFor="amount">
                <div className="relative">
                  <div className={iconSlot}>
                    <Coins className="h-5 w-5" aria-hidden />
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

              <FormField label="Category" htmlFor="category">
                <div className="relative">
                  <div className={iconSlot}>
                    <Tag className="h-5 w-5" aria-hidden />
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

              <FormField label="Description" htmlFor="description">
                <div className="relative">
                  <div className={iconSlot}>
                    <FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Short note"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </FormField>

              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="pt-2">
                <Button type="submit" isLoading={submitting} className="w-full">
                  Save expense
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default Expenses;
