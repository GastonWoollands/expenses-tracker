/**
 * useUserCategories Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useUserCategories } from '../useUserCategories';
import { ADDITIONAL_CATEGORIES, CORE_CATEGORIES } from '../../config/categories';

describe('useUserCategories', () => {
  it('loads combined categories after initial fetch', async () => {
    const { result } = renderHook(() => useUserCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const expectedCount = CORE_CATEGORIES.length + ADDITIONAL_CATEGORIES.length;
    expect(result.current.categories.length).toBe(expectedCount);
    expect(result.current.isFallback).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.categories[0]).toMatchObject({
      key: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      is_user_selected: false,
    });
  });

  it('provides refetch and returns to idle', async () => {
    const { result } = renderHook(() => useUserCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories.length).toBe(CORE_CATEGORIES.length + ADDITIONAL_CATEGORIES.length);
  });
});
