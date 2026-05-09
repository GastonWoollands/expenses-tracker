/**
 * BudgetCategorySetup: modal for choosing budget categories
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Settings, Search } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import { ALL_CATEGORIES, CORE_CATEGORIES } from '../../config/categories';
import { budgetApiService } from '../../services/budgetApi';

export interface CategorySetup {
  key: string;
  name: string;
  description: string;
  budget: number;
  enabled: boolean;
}

interface BudgetCategorySetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: CategorySetup[]) => void;
  existingBudgets?: Array<{ category_key: string; amount: number }>;
}

const BudgetCategorySetup: React.FC<BudgetCategorySetupProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBudgets = [],
}) => {
  const [categories, setCategories] = useState<CategorySetup[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      const coreCategoryKeys = CORE_CATEGORIES.map((cat) => cat.key);
      const initialCategories: CategorySetup[] = ALL_CATEGORIES.map((cat) => {
        const existingBudget = existingBudgets.find((b) => b.category_key === cat.key);
        const isCoreCategory = coreCategoryKeys.includes(cat.key);
        return {
          key: cat.key,
          name: cat.label,
          description: cat.description,
          budget: existingBudget?.amount || 0,
          enabled: existingBudget ? true : isCoreCategory,
        };
      });
      setCategories(initialCategories);
    }
  }, [isOpen, existingBudgets]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const searchLower = searchTerm.toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower) ||
        category.key.toLowerCase().includes(searchLower),
    );
  }, [categories, searchTerm]);

  const handleCategoryToggle = (key: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.key === key ? { ...cat, enabled: !cat.enabled, budget: cat.enabled ? 0 : cat.budget } : cat,
      ),
    );
  };

  const handleBudgetChange = (key: string, budget: number) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.key === key ? { ...cat, budget: Math.max(0, budget) } : cat)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const enabledCategories = categories.filter((cat) => cat.enabled);

      for (const category of enabledCategories) {
        if (category.budget > 0) {
          await budgetApiService.updateBudgetByCategory(category.key, category.budget);
        }
      }

      onSave(enabledCategories);
      onClose();
    } catch (error) {
      console.error('Error saving budget categories:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSelectAll = () => {
    const categoriesToToggle = searchTerm ? filteredCategories : categories;
    const allEnabled = categoriesToToggle.every((cat) => cat.enabled);

    setCategories((prev) =>
      prev.map((cat) => {
        const shouldToggle = categoriesToToggle.some((filteredCat) => filteredCat.key === cat.key);
        if (shouldToggle) {
          return {
            ...cat,
            enabled: !allEnabled,
            budget: !allEnabled ? cat.budget : 0,
          };
        }
        return cat;
      }),
    );
  };

  if (!isOpen) return null;

  const toggleSet = searchTerm ? filteredCategories : categories;
  const allSelectedInToggle = toggleSet.length > 0 && toggleSet.every((cat) => cat.enabled);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-setup-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-raised shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-[var(--radius-control)] border border-accent-soft-border bg-accent-soft p-2 dark:bg-accent/10">
              <Settings className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="budget-setup-title" className="text-lg font-semibold text-fg sm:text-xl">
                Set up budget categories
              </h2>
              <p className="mt-0.5 text-sm font-light text-fg-muted">Choose which categories to include in your budget.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-[var(--radius-control)] p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="max-h-[60vh] flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              <Input
                type="text"
                placeholder="Search categories…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm font-light text-fg-muted">
                Found {filteredCategories.length} of {categories.length} categories
              </p>
            )}
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-surface-muted/30">
            <div className="min-w-0">
              <h3 className="font-medium text-fg">{searchTerm ? 'Select all filtered' : 'Select all categories'}</h3>
              <p className="mt-0.5 text-sm font-light text-fg-muted">
                {searchTerm
                  ? `Enable all ${filteredCategories.length} matching categories.`
                  : 'Enable every category for budget tracking.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className={`shrink-0 rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised ${
                allSelectedInToggle
                  ? 'bg-accent text-on-accent hover:opacity-95'
                  : 'border border-border bg-surface-raised text-fg shadow-[var(--shadow-card)] hover:bg-surface-hover'
              }`}
            >
              {allSelectedInToggle ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-3">
            {filteredCategories.length === 0 && searchTerm ? (
              <div className="py-8 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-fg-muted opacity-50" aria-hidden />
                <h3 className="mb-2 text-lg font-medium text-fg">No categories found</h3>
                <p className="text-sm font-light text-fg-muted">Try a different search.</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.key}
                  className={`rounded-[var(--radius-card)] border p-4 transition-colors ${
                    category.enabled
                      ? 'border-accent-soft-border bg-accent-soft dark:bg-accent/10'
                      : 'border-border bg-surface-raised'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => handleCategoryToggle(category.key)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised ${
                        category.enabled ? 'border-accent bg-accent' : 'border-border-strong bg-input'
                      }`}
                      aria-pressed={category.enabled}
                      aria-label={category.enabled ? `Disable ${category.name}` : `Enable ${category.name}`}
                    >
                      {category.enabled && <Check className="h-3 w-3 text-on-accent" aria-hidden />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-fg">{category.name}</h4>
                        {category.enabled && (
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
                            Enabled
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-light text-fg-muted">{category.description}</p>
                    </div>

                    {category.enabled && (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm text-fg-muted">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={category.budget}
                          onChange={(e) => handleBudgetChange(category.key, parseFloat(e.target.value) || 0)}
                          className="w-24 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-muted/30 p-5 sm:flex-row sm:justify-end sm:gap-3 sm:p-6 dark:bg-surface-muted/20">
          <Button type="button" onClick={handleClose} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !categories.some((cat) => cat.enabled)}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Save categories
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetCategorySetup;
