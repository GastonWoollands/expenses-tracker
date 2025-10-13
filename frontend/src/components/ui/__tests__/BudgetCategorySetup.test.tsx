/**
 * BudgetCategorySetup Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BudgetCategorySetup from '../BudgetCategorySetup';
import { ALL_CATEGORIES } from '../../../config/categories';

// Mock the budget API service
jest.mock('../../../services/budgetApi', () => ({
  budgetApiService: {
    updateBudgetByCategory: jest.fn().mockResolvedValue({}),
  },
}));

describe('BudgetCategorySetup', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search box when modal is open', () => {
    render(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
  });

  it('filters categories based on search term', async () => {
    render(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search categories...');
    
    // Search for "food"
    fireEvent.change(searchInput, { target: { value: 'food' } });
    
    await waitFor(() => {
      expect(screen.getByText('Found 1 of 65 categories')).toBeInTheDocument();
    });
  });

  it('shows no results message when search finds nothing', async () => {
    render(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search categories...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No categories found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
    });
  });

  it('clears search when modal is closed', () => {
    const { rerender } = render(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search categories...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(searchInput).toHaveValue('test');

    // Close modal
    rerender(
      <BudgetCategorySetup
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Reopen modal
    rerender(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByPlaceholderText('Search categories...')).toHaveValue('');
  });

  it('updates select all button text based on filtered categories', async () => {
    render(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search categories...');
    
    // Search for "food" (should find 1 category)
    fireEvent.change(searchInput, { target: { value: 'food' } });
    
    await waitFor(() => {
      expect(screen.getByText('Select All Filtered')).toBeInTheDocument();
      expect(screen.getByText('Enable all 1 filtered categories')).toBeInTheDocument();
    });
  });

  it('searches by category name, description, and key', async () => {
    render(
      <BudgetCategorySetup
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search categories...');
    
    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Food' } });
    await waitFor(() => {
      expect(screen.getByText('Found 1 of 65 categories')).toBeInTheDocument();
    });

    // Search by description
    fireEvent.change(searchInput, { target: { value: 'groceries' } });
    await waitFor(() => {
      expect(screen.getByText('Found 1 of 65 categories')).toBeInTheDocument();
    });

    // Search by key
    fireEvent.change(searchInput, { target: { value: 'food' } });
    await waitFor(() => {
      expect(screen.getByText('Found 1 of 65 categories')).toBeInTheDocument();
    });
  });
});