/**
 * CategorySearchSelect Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategorySearchSelect from '../CategorySearchSelect';

describe('CategorySearchSelect', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    expect(screen.getByText('Select category')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });
  });

  it('shows search input when dropdown is open', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });
  });

  it('filters categories based on search term', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Search categories...');
    fireEvent.change(searchInput, { target: { value: 'food' } });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('groceries, supermarket, etc.')).toBeInTheDocument();
    });
  });

  it('shows no results when search finds nothing', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Search categories...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No categories found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });
  });

  it('calls onChange when category is selected', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const foodCategory = await screen.findByText('Food');
    fireEvent.click(foodCategory);

    expect(mockOnChange).toHaveBeenCalledWith('food');
  });

  it('displays selected category', () => {
    render(
      <CategorySearchSelect
        value="food"
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('clears selection when clear button is clicked', () => {
    render(
      <CategorySearchSelect
        value="food"
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const clearButton = screen.getByLabelText('Clear selection');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('handles keyboard navigation', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    
    // Open dropdown with Enter key
    fireEvent.keyDown(trigger, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });

    // Navigate with arrow keys
    const searchInput = screen.getByPlaceholderText('Search categories...');
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    // Select with Enter
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('closes dropdown with Escape key', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search categories...');
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument();
    });
  });

  it('shows search results count', async () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Search categories...');
    fireEvent.change(searchInput, { target: { value: 'food' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 65 categories/)).toBeInTheDocument();
    });
  });

  it('applies required styling when required and no value', () => {
    render(
      <CategorySearchSelect
        value=""
        onChange={mockOnChange}
        placeholder="Select category"
        required
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('border-red-300');
  });
});
