/**
 * BudgetCategorySetup Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BudgetCategorySetup from '../BudgetCategorySetup';
import { ALL_CATEGORIES } from '../../../config/categories';

vi.mock('../../../services/budgetApi', () => ({
  budgetApiService: {
    updateBudgetByCategory: vi.fn().mockResolvedValue({}),
  },
}));

describe('BudgetCategorySetup', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search box when modal is open', () => {
    render(<BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByPlaceholderText('Search categories…')).toBeInTheDocument();
  });

  it('filters categories based on search term', async () => {
    render(<BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const searchInput = screen.getByPlaceholderText('Search categories…');

    fireEvent.change(searchInput, { target: { value: 'food' } });

    await waitFor(() => {
      expect(screen.getByText(`Found 1 of ${ALL_CATEGORIES.length} categories`)).toBeInTheDocument();
    });
  });

  it('shows no results message when search finds nothing', async () => {
    render(<BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const searchInput = screen.getByPlaceholderText('Search categories…');

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No categories found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search.')).toBeInTheDocument();
    });
  });

  it('clears search when modal is closed', () => {
    const { rerender } = render(
      <BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />,
    );

    const searchInput = screen.getByPlaceholderText('Search categories…');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(searchInput).toHaveValue('test');

    rerender(<BudgetCategorySetup isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />);

    rerender(<BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByPlaceholderText('Search categories…')).toHaveValue('');
  });

  it('updates select all button text based on filtered categories', async () => {
    render(<BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const searchInput = screen.getByPlaceholderText('Search categories…');

    fireEvent.change(searchInput, { target: { value: 'food' } });

    await waitFor(() => {
      expect(screen.getByText('Select all filtered')).toBeInTheDocument();
      expect(screen.getByText('Enable all 1 matching categories.')).toBeInTheDocument();
    });
  });

  it('searches by category name, description, and key', async () => {
    render(<BudgetCategorySetup isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const searchInput = screen.getByPlaceholderText('Search categories…');

    fireEvent.change(searchInput, { target: { value: 'Food' } });
    await waitFor(() => {
      expect(screen.getByText(`Found 1 of ${ALL_CATEGORIES.length} categories`)).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'groceries' } });
    await waitFor(() => {
      expect(screen.getByText(`Found 1 of ${ALL_CATEGORIES.length} categories`)).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'food' } });
    await waitFor(() => {
      expect(screen.getByText(`Found 1 of ${ALL_CATEGORIES.length} categories`)).toBeInTheDocument();
    });
  });
});
