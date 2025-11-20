/**
 * Expenses page: minimalist form for adding expenses
 */

import React, { useState } from 'react';
import { Alert, Button, Card, Container, FormField, Heading, Input, CategorySearchSelect } from '../components';
import { ALL_CATEGORIES, CATEGORY_KEYS } from '../config/categories';
import { apiService } from '../services/api';
import { Calendar, Coins, FileText, Tag } from 'lucide-react';

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

const Expenses: React.FC = () => {
  const [form, setForm] = useState<ExpenseFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const updateField = (key: keyof ExpenseFormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
      const categoryInfo = ALL_CATEGORIES.find(c => c.key === form.category);
      await apiService.createExpense({
        date: form.date + 'T00:00:00', // Convert to ISO datetime
        amount: Number(form.amount),
        category: categoryInfo?.label || form.category,
        description: form.description.trim(),
      });
      setSuccess('Expense saved.');
      setForm(initialState);
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10">
      <Container width="md">
        <div className="mb-8 text-center">
          <Heading level={2}>Add Expense</Heading>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Record a new transaction</p>
        </div>

        <Card>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField label="Date" htmlFor="date">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500 dark:text-blue-400 z-10">
                  <Calendar className="h-5 w-5" />
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

            <FormField label="Description" htmlFor="description">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500 dark:text-orange-400 z-10">
                  <FileText className="h-5 w-5" />
                </div>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Add a short note"
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
                Save Expense
              </Button>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
};

export default Expenses;