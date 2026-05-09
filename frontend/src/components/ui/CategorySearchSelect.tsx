/**
 * CategorySearchSelect: Searchable category dropdown for expense form
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useUserCategories } from '../../hooks/useUserCategories';

interface CategorySearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const CategorySearchSelect: React.FC<CategorySearchSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select category',
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get user categories
  const { categories: userCategories, isLoading, error, isFallback } = useUserCategories();

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return userCategories.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    const searchLower = searchTerm.toLowerCase();
    return userCategories
      .filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower) ||
        category.key.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, userCategories]);

  // Get selected category
  const selectedCategory = userCategories.find(cat => cat.key === value);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        searchInputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
          const category = filteredCategories[highlightedIndex];
          onChange(category.key);
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryKey: string) => {
    onChange(categoryKey);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 text-left rounded-[var(--radius-control)] sm:text-sm bg-input text-fg border border-border-strong shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-surface ${
            isOpen ? 'ring-2 ring-ring ring-offset-1 ring-offset-surface border-border-strong' : ''
          } ${required && !value ? 'border-red-400 dark:border-red-500/60' : ''} ${
            value ? 'pr-20' : 'pr-10'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-required={required}
        >
          <span className={selectedCategory ? 'text-fg' : 'text-fg-muted'}>
            {isLoading ? 'Loading categories...' : selectedCategory ? selectedCategory.name : placeholder}
          </span>
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="rounded-[var(--radius-control)] p-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 shrink-0 text-fg-muted transition-transform ${isOpen ? 'rotate-180' : ''} pointer-events-none`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-raised shadow-[var(--shadow-card-hover)]">
          {/* Search Input */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="w-full rounded-[var(--radius-control)] border border-border-strong bg-input py-2 pl-10 pr-3 text-sm text-fg placeholder:text-fg-muted/80 transition-colors duration-150 hover:border-border focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-surface"
              />
            </div>
            {searchTerm && (
              <p className="mt-1 text-xs font-light text-fg-muted">
                {filteredCategories.length} of {userCategories.length} categories
              </p>
            )}
            {isFallback && !searchTerm && (
              <p className="mt-1 text-xs font-light text-fg-muted">
                Using default categories. Set up your budget to see your custom categories.
              </p>
            )}
          </div>

          {/* Category List */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-fg-muted">
                <div
                  className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent"
                  role="status"
                  aria-label="Loading"
                />
                <p className="text-sm text-fg">Loading categories…</p>
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">Failed to load categories</p>
                <p className="mt-1 text-xs font-light text-fg-muted">Using default categories</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-fg-muted">
                <Search className="mx-auto mb-2 h-8 w-8 opacity-40" aria-hidden />
                <p className="text-sm text-fg">No categories found</p>
                <p className="text-xs font-light">Try adjusting your search</p>
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => handleCategorySelect(category.key)}
                  className={`w-full px-3 py-2 text-left text-fg transition-colors focus:outline-none focus-visible:bg-surface-hover ${
                    index === highlightedIndex
                      ? 'bg-surface-hover'
                      : value === category.key
                        ? 'bg-accent-soft text-accent dark:bg-accent/15'
                        : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {category.is_user_selected && (
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
                          Your budget
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs font-light text-fg-muted">{category.description}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySearchSelect;
