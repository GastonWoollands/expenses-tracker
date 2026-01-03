/**
 * useAnalyticsData: Custom hook for fetching and managing analytics data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import { type FilterOptions } from '../utils/analytics';
import { formatDateForAPI } from '../utils/analytics';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface AnalyticsData {
  trends: Array<{ month: string; total_amount: number; count: number }>;
  topCategories: Array<{
    category: string;
    current_amount: number;
    previous_amount: number;
    count: number;
    trend_percentage: number;
    trend_direction: 'up' | 'down' | 'stable';
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  fixedVsVariable: {
    fixed: { amount: number; count: number; percentage: number };
    variable: { amount: number; count: number; percentage: number };
  };
}

interface UseAnalyticsDataReturn {
  data: AnalyticsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAnalyticsData = (
  filters: FilterOptions
): UseAnalyticsDataReturn => {
  const [data, setData] = useState<AnalyticsData>({
    trends: [],
    topCategories: [],
    categoryBreakdown: [],
    fixedVsVariable: {
      fixed: { amount: 0, count: 0, percentage: 0 },
      variable: { amount: 0, count: 0, percentage: 0 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine date range - default to current month if not specified
  const startDate = useMemo(() => {
    return filters.startDate || startOfMonth(new Date());
  }, [filters.startDate]);

  const endDate = useMemo(() => {
    return filters.endDate || endOfMonth(new Date());
  }, [filters.endDate]);

  // Convert expense type filter to API format
  const expenseType = useMemo(() => {
    if (filters.expenseType === 'fixed') return 'fixed';
    if (filters.expenseType === 'variable') return 'variable';
    return undefined;
  }, [filters.expenseType]);

  // Calculate last 6 months date range for trends (always independent of filters)
  const trendsStartDate = useMemo(() => {
    const now = new Date();
    return subMonths(now, 6);
  }, []);

  const trendsEndDate = useMemo(() => {
    return new Date();
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      
      // Trends always use last 6 months, independent of filters
      const trendsStartDateStr = formatDateForAPI(trendsStartDate);
      const trendsEndDateStr = formatDateForAPI(trendsEndDate);

      // Fetch all analytics data in parallel
      // Trends: Always last 6 months, respects expenseType, categories, and amount filters
      // Other charts: Use date filters from user selection
      const [trends, topCategories, categoryBreakdown, fixedVsVariable] = await Promise.all([
        apiService.getExpenseTrends(
          trendsStartDateStr,
          trendsEndDateStr,
          expenseType,
          filters.categories,
          filters.minAmount,
          filters.maxAmount
        ),
        apiService.getTopCategoriesWithTrends(
          startDateStr,
          endDateStr,
          expenseType,
          filters.categories,
          filters.minAmount,
          filters.maxAmount,
          10
        ),
        apiService.getCategoryBreakdown(
          startDateStr,
          endDateStr,
          expenseType,
          filters.categories,
          filters.minAmount,
          filters.maxAmount
        ),
        apiService.getFixedVsVariableComparison(
          startDateStr,
          endDateStr,
          filters.categories,
          filters.minAmount,
          filters.maxAmount
        )
      ]);

      setData({
        trends,
        topCategories,
        categoryBreakdown: categoryBreakdown.map(item => ({
          category: item.category,
          amount: item.amount,
          count: item.count,
          percentage: item.percentage
        })),
        fixedVsVariable
      });
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, expenseType, filters.categories, filters.minAmount, filters.maxAmount, trendsStartDate, trendsEndDate]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalyticsData
  };
};

