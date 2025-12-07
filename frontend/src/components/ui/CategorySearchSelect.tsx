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
          className={`w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
          } ${required && !value ? 'border-red-300 dark:border-red-600' : ''} ${
            value ? 'pr-20' : 'pr-10'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-required={required}
        >
          <span className={selectedCategory ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
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
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} pointer-events-none`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                className="w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {searchTerm && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {filteredCategories.length} of {userCategories.length} categories
              </p>
            )}
            {isFallback && !searchTerm && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Using default categories. Set up your budget to see your custom categories.
              </p>
            )}
          </div>

          {/* Category List */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading categories...</p>
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-center text-red-500 dark:text-red-400">
                <p className="text-sm">Failed to load categories</p>
                <p className="text-xs">Using default categories</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No categories found</p>
                <p className="text-xs">Try adjusting your search</p>
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => handleCategorySelect(category.key)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                    index === highlightedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  } ${value === category.key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{category.name}</span>
                      {category.is_user_selected && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Your Budget
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {category.description}
                    </span>
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
