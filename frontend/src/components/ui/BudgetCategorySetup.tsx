/**
 * BudgetCategorySetup: Modal for setting up budget categories
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Settings, Search } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import Card from '../Card';
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
  existingBudgets = []
}) => {
  const [categories, setCategories] = useState<CategorySetup[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize categories from ALL_CATEGORIES with core categories selected by default
  useEffect(() => {
    if (isOpen) {
      const coreCategoryKeys = CORE_CATEGORIES.map(cat => cat.key);
      const initialCategories: CategorySetup[] = ALL_CATEGORIES.map(cat => {
        const existingBudget = existingBudgets.find(b => b.category_key === cat.key);
        const isCoreCategory = coreCategoryKeys.includes(cat.key);
        return {
          key: cat.key,
          name: cat.label,
          description: cat.description,
          budget: existingBudget?.amount || 0,
          enabled: existingBudget ? true : isCoreCategory
        };
      });
      setCategories(initialCategories);
    }
  }, [isOpen, existingBudgets]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchLower) ||
      category.description.toLowerCase().includes(searchLower) ||
      category.key.toLowerCase().includes(searchLower)
    );
  }, [categories, searchTerm]);

  const handleCategoryToggle = (key: string) => {
    setCategories(prev => prev.map(cat => 
      cat.key === key 
        ? { ...cat, enabled: !cat.enabled, budget: cat.enabled ? 0 : cat.budget }
        : cat
    ));
  };

  const handleBudgetChange = (key: string, budget: number) => {
    setCategories(prev => prev.map(cat => 
      cat.key === key 
        ? { ...cat, budget: Math.max(0, budget) }
        : cat
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const enabledCategories = categories.filter(cat => cat.enabled);
      
      // Save each enabled category budget
      for (const category of enabledCategories) {
        if (category.budget > 0) {
          await budgetApiService.updateBudgetByCategory(category.key, category.budget);
        }
      }
      
      onSave(enabledCategories);
      onClose();
    } catch (error) {
      console.error('Error saving budget categories:', error);
      // You might want to show an error message here
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSearchTerm(''); // Clear search when closing
    onClose();
  };

  const handleSelectAll = () => {
    // If searching, only toggle filtered categories
    const categoriesToToggle = searchTerm ? filteredCategories : categories;
    const allEnabled = categoriesToToggle.every(cat => cat.enabled);
    
    setCategories(prev => prev.map(cat => {
      const shouldToggle = categoriesToToggle.some(filteredCat => filteredCat.key === cat.key);
      if (shouldToggle) {
        return { 
          ...cat, 
          enabled: !allEnabled,
          budget: !allEnabled ? cat.budget : 0
        };
      }
      return cat;
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Set Up Budget Categories
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which categories to include in your budget
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Found {filteredCategories.length} of {categories.length} categories
              </p>
            )}
          </div>

          {/* Select All Toggle */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {searchTerm ? 'Select All Filtered' : 'Select All Categories'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? `Enable all ${filteredCategories.length} filtered categories`
                  : 'Enable all categories for budget tracking'
                }
              </p>
            </div>
            <button
              onClick={handleSelectAll}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                (searchTerm ? filteredCategories : categories).every(cat => cat.enabled)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {(searchTerm ? filteredCategories : categories).every(cat => cat.enabled) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-3">
            {filteredCategories.length === 0 && searchTerm ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No categories found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => (
              <div
                key={category.key}
                className={`p-4 rounded-lg border transition-all ${
                  category.enabled
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Toggle */}
                  <button
                    onClick={() => handleCategoryToggle(category.key)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      category.enabled
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {category.enabled && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h4>
                      {category.enabled && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {category.description}
                    </p>
                  </div>

                  {/* Budget Input */}
                  {category.enabled && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">$</span>
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

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            onClick={handleClose}
            variant="secondary"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !categories.some(cat => cat.enabled)}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Budget Categories</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BudgetCategorySetup;
