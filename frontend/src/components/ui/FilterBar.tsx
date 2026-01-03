/**
 * FilterBar: Comprehensive filtering component for analytics
 */

import React, { useState, useMemo } from 'react';
import { Search, X, Filter, DollarSign } from 'lucide-react';
import DateRangePicker, { type DateRange } from './DateRangePicker';
import { useUserCategories } from '../../hooks/useUserCategories';
import type { FilterOptions } from '../../utils/analytics';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  className = ''
}) => {
  const { categories } = useUserCategories();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Get unique category names from expenses (we'll get this from the parent)
  const categoryOptions = useMemo(() => {
    return categories.map(cat => cat.name);
  }, [categories]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce will be handled by parent
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const handleSelectAllCategories = () => {
    onFiltersChange({
      ...filters,
      categories: categoryOptions
    });
  };

  const handleDeselectAllCategories = () => {
    onFiltersChange({
      ...filters,
      categories: undefined
    });
  };

  const handleAmountChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onFiltersChange({
      ...filters,
      [type === 'min' ? 'minAmount' : 'maxAmount']: numValue
    });
  };

  const handleDateRangeChange = (range: DateRange) => {
    onFiltersChange({
      ...filters,
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined
    });
  };

  const handleExpenseTypeChange = (type: 'all' | 'fixed' | 'variable') => {
    onFiltersChange({
      ...filters,
      expenseType: type
    });
  };

  const handleQuickFilter = (preset: string) => {
    const now = new Date();
    let newFilters: FilterOptions = { ...filters };

    switch (preset) {
      case 'this-week':
        newFilters.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
        newFilters.endDate = now;
        break;
      case 'last-30-days':
        newFilters.startDate = subDays(now, 30);
        newFilters.endDate = now;
        break;
      case 'this-month':
        newFilters.startDate = startOfMonth(now);
        newFilters.endDate = endOfMonth(now);
        break;
      case 'over-budget':
        // This would need budget data - for now just set a high amount filter
        newFilters.minAmount = 1000;
        break;
    }

    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: undefined,
      categories: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      startDate: undefined,
      endDate: undefined,
      expenseType: 'all'
    });
    setSearchValue('');
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      (filters.categories && filters.categories.length > 0) ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined ||
      filters.startDate ||
      filters.endDate ||
      (filters.expenseType && filters.expenseType !== 'all')
    );
  }, [filters]);

  return (
    <div className={`${className}`}>
      <div className="flex flex-col gap-5">
        {/* Main filters row */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by description or category..."
                className="w-full pl-10 pr-3 py-2.5 text-sm border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="min-w-[250px]">
            <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
              Date Range
            </label>
            <DateRangePicker
              value={{
                startDate: filters.startDate || null,
                endDate: filters.endDate || null
              }}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Expense Type Filter */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
              Expense Type
            </label>
            <div className="flex gap-0.5 border-b border-slate-200 dark:border-slate-700">
              {(['all', 'fixed', 'variable'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleExpenseTypeChange(type)}
                  className={`flex-1 px-4 py-2 text-xs font-normal transition-colors border-b-2 ${
                    filters.expenseType === type || (!filters.expenseType && type === 'all')
                      ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'fixed' ? 'Fixed' : 'Variable'}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-0 py-2 text-xs font-normal text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced filters toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-normal text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
        </button>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-3">
                Categories
                {filters.categories && filters.categories.length > 0 && (
                  <span className="ml-2 text-slate-400 dark:text-slate-500">
                    ({filters.categories.length} selected)
                  </span>
                )}
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={handleSelectAllCategories}
                  className="text-xs font-normal text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllCategories}
                  className="text-xs font-normal text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Deselect All
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {categoryOptions.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2.5 text-sm font-normal text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 py-1 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category) || false}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-3.5 h-3.5 text-slate-900 border-slate-300 rounded focus:ring-slate-400"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-3">
                Amount Range
              </label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-normal text-slate-400 dark:text-slate-500 mb-2">Min</label>
                  <div className="relative">
                    <DollarSign className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={filters.minAmount?.toString() || ''}
                      onChange={(e) => handleAmountChange('min', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full pl-6 pr-0 py-2 text-sm border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>
                <span className="text-slate-300 dark:text-slate-600 mb-2">-</span>
                <div className="flex-1">
                  <label className="block text-xs font-normal text-slate-400 dark:text-slate-500 mb-2">Max</label>
                  <div className="relative">
                    <DollarSign className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={filters.maxAmount?.toString() || ''}
                      onChange={(e) => handleAmountChange('max', e.target.value)}
                      placeholder="∞"
                      min="0"
                      step="0.01"
                      className="w-full pl-6 pr-0 py-2 text-sm border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 self-center">Quick Filters:</span>
          {[
            { key: 'this-week', label: 'This Week' },
            { key: 'last-30-days', label: 'Last 30 Days' },
            { key: 'this-month', label: 'This Month' },
            { key: 'over-budget', label: 'Over Budget' }
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handleQuickFilter(preset.key)}
              className="px-0 py-1 text-xs font-normal text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

