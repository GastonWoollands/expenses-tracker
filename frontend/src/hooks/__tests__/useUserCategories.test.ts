/**
 * useUserCategories Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUserCategories } from '../useUserCategories';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getUserBudgetCategories: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('useUserCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user categories when API call succeeds', async () => {
    const mockResponse = {
      categories: [
        {
          key: 'food',
          name: 'Food',
          description: 'groceries, supermarket, etc.',
          is_user_selected: true,
        },
        {
          key: 'transport',
          name: 'Transport',
          description: 'Uber, train, bus, etc.',
          is_user_selected: true,
        },
      ],
      is_fallback: false,
    };

    mockApiService.getUserBudgetCategories.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserCategories());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.categories).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockResponse.categories);
    expect(result.current.isFallback).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return fallback categories when user has no budgets', async () => {
    const mockResponse = {
      categories: [
        {
          key: 'food',
          name: 'Food',
          description: 'groceries, supermarket, etc.',
          is_user_selected: false,
        },
      ],
      is_fallback: true,
    };

    mockApiService.getUserBudgetCategories.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockResponse.categories);
    expect(result.current.isFallback).toBe(true);
  });

  it('should handle API errors and return fallback categories', async () => {
    mockApiService.getUserBudgetCategories.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useUserCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load categories');
    expect(result.current.isFallback).toBe(true);
    expect(result.current.categories.length).toBeGreaterThan(0); // Should have core categories
  });

  it('should provide refetch function', async () => {
    const mockResponse = {
      categories: [],
      is_fallback: true,
    };

    mockApiService.getUserBudgetCategories.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Test refetch
    const newResponse = {
      categories: [
        {
          key: 'food',
          name: 'Food',
          description: 'groceries, supermarket, etc.',
          is_user_selected: true,
        },
      ],
      is_fallback: false,
    };

    mockApiService.getUserBudgetCategories.mockResolvedValue(newResponse);

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.categories).toEqual(newResponse.categories);
    });
  });
});
