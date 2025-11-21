/**
 * Custom hook for managing user budget categories
 */

import { useState, useEffect } from 'react';
import { CORE_CATEGORIES, ADDITIONAL_CATEGORIES } from '../config/categories';

export interface UserCategory {
  key: string;
  name: string;
  description: string;
  is_user_selected: boolean;
}

interface UseUserCategoriesReturn {
  categories: UserCategory[];
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
  refetch: () => Promise<void>;
}

export const useUserCategories = (): UseUserCategoriesReturn => {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const fetchUserCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, use frontend categories directly since they match the backend
      // This avoids API issues and keeps it simple
      const allCategories = [...CORE_CATEGORIES, ...ADDITIONAL_CATEGORIES];
      
      const categories: UserCategory[] = allCategories.map(cat => ({
        key: cat.key,
        name: cat.label,
        description: cat.description,
        is_user_selected: false
      }));
      
      setCategories(categories);
      setIsFallback(false);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
      
      // Fallback to core categories if something goes wrong
      const fallbackCategories: UserCategory[] = CORE_CATEGORIES.map(cat => ({
        key: cat.key,
        name: cat.label,
        description: cat.description,
        is_user_selected: false
      }));
      
      setCategories(fallbackCategories);
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
    isFallback,
    refetch: fetchUserCategories
  };
};
