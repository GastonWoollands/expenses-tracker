/**
 * API service for backend communication
 */

import { getSession } from '../firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
  is_fixed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  amount: number;
  category: string;
  description: string;
  date: string;
  currency?: string;
  is_fixed?: boolean;
}

export interface ExpenseUpdate {
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  currency?: string;
  is_fixed?: boolean;
}

export interface ExpenseSummary {
  total_amount: number;
  total_count: number;
  average_amount: number;
  period: string;
  category_breakdown: Record<string, { amount: number; count: number }>;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FixedExpense {
  id: string;
  user_id: string;
  category_id?: string;
  category_name: string;
  category_key?: string;
  amount: number;
  description: string;
  day_of_month: number;
  is_active: boolean;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface FixedExpenseCreate {
  category: string;
  amount: number;
  description: string;
  day_of_month: number;
  currency?: string;
  is_active?: boolean;
}

export interface FixedExpenseUpdate {
  category?: string;
  amount?: number;
  description?: string;
  day_of_month?: number;
  currency?: string;
  is_active?: boolean;
}

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getSession();
    if (!token) {
      console.error('No token available - user may not be authenticated');
      throw new Error('User not authenticated');
    }

    console.log('Auth headers prepared, token length:', token.length);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API: Making request to:', url, 'with options:', options);
    
    const headers = await this.getAuthHeaders();
    console.log('API: Auth headers:', headers);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log('API: Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('API: Request failed:', response.status, response.statusText, error);
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('API: Response data:', data);
    return data;
  }

  // Authentication
  async verifyToken(): Promise<{ valid: boolean; user: any }> {
    return this.request('/auth/verify');
  }

  // Expenses
  async getExpenses(
    limit = 100, 
    offset = 0, 
    startDate?: string, 
    endDate?: string
  ): Promise<Expense[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    console.log('API: Getting expenses with limit:', limit, 'offset:', offset, 'startDate:', startDate, 'endDate:', endDate);
    const result = await this.request<Expense[]>(`/expenses?${params.toString()}`);
    console.log('API: Expenses result:', result);
    return result;
  }

  async getExpense(id: string): Promise<Expense> {
    return this.request(`/expenses/${id}`);
  }

  async createExpense(expense: ExpenseCreate): Promise<Expense> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, expense: ExpenseUpdate): Promise<Expense> {
    console.log('API: updateExpense called with:', { id, expense });
    try {
      const result = await this.request<Expense>(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(expense),
      });
      console.log('API: updateExpense success:', result);
      return result;
    } catch (error) {
      console.error('API: updateExpense error:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<{ message: string }> {
    console.log('API: deleteExpense called with id:', id);
    try {
      const result = await this.request<{ message: string }>(`/expenses/${id}`, {
        method: 'DELETE',
      });
      console.log('API: deleteExpense success:', result);
      return result;
    } catch (error) {
      console.error('API: deleteExpense error:', error);
      throw error;
    }
  }

  // Analytics
  async getExpenseSummary(month?: number, year?: number): Promise<ExpenseSummary> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    return this.request(`/analytics/summary?${params.toString()}`);
  }

  // Analytics - Trends
  async getExpenseTrends(
    startDate?: string,
    endDate?: string,
    expenseType?: 'fixed' | 'variable',
    categories?: string[],
    minAmount?: number,
    maxAmount?: number
  ): Promise<Array<{ month: string; total_amount: number; count: number }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (expenseType) params.append('expense_type', expenseType);
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());
    if (maxAmount !== undefined) params.append('max_amount', maxAmount.toString());
    
    return this.request(`/analytics/trends?${params.toString()}`);
  }

  // Analytics - Patterns
  async getSpendingPatterns(
    startDate?: string,
    endDate?: string,
    expenseType?: 'fixed' | 'variable',
    categories?: string[],
    minAmount?: number,
    maxAmount?: number
  ): Promise<{
    day_of_week: Array<{
      day: string;
      day_index: number;
      total_amount: number;
      count: number;
      average: number;
    }>;
    time_of_month: Array<{
      period: string;
      total_amount: number;
      count: number;
      average: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (expenseType) params.append('expense_type', expenseType);
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());
    if (maxAmount !== undefined) params.append('max_amount', maxAmount.toString());
    
    return this.request(`/analytics/patterns?${params.toString()}`);
  }

  // Analytics - Top Categories with Trends
  async getTopCategoriesWithTrends(
    startDate?: string,
    endDate?: string,
    expenseType?: 'fixed' | 'variable',
    categories?: string[],
    minAmount?: number,
    maxAmount?: number,
    limit: number = 10
  ): Promise<Array<{
    category: string;
    current_amount: number;
    previous_amount: number;
    count: number;
    trend_percentage: number;
    trend_direction: 'up' | 'down' | 'stable';
  }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (expenseType) params.append('expense_type', expenseType);
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());
    if (maxAmount !== undefined) params.append('max_amount', maxAmount.toString());
    params.append('limit', limit.toString());
    
    return this.request(`/analytics/top-categories?${params.toString()}`);
  }

  // Analytics - Category Breakdown (updated to accept filters)
  async getCategoryBreakdown(
    startDate?: string,
    endDate?: string,
    expenseType?: 'fixed' | 'variable',
    categories?: string[],
    minAmount?: number,
    maxAmount?: number
  ): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (expenseType) params.append('expense_type', expenseType);
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());
    if (maxAmount !== undefined) params.append('max_amount', maxAmount.toString());
    
    return this.request(`/analytics/categories?${params.toString()}`);
  }

  // Analytics - Fixed vs Variable Comparison
  async getFixedVsVariableComparison(
    startDate?: string,
    endDate?: string,
    categories?: string[],
    minAmount?: number,
    maxAmount?: number
  ): Promise<{
    fixed: { amount: number; count: number; percentage: number };
    variable: { amount: number; count: number; percentage: number };
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());
    if (maxAmount !== undefined) params.append('max_amount', maxAmount.toString());
    
    return this.request(`/analytics/fixed-vs-variable?${params.toString()}`);
  }

  // Fixed Expenses
  async getFixedExpenses(): Promise<FixedExpense[]> {
    return this.request('/api/v1/fixed-expenses');
  }

  async getFixedExpense(id: string): Promise<FixedExpense> {
    return this.request(`/api/v1/fixed-expenses/${id}`);
  }

  async createFixedExpense(fixedExpense: FixedExpenseCreate): Promise<FixedExpense> {
    return this.request('/api/v1/fixed-expenses', {
      method: 'POST',
      body: JSON.stringify(fixedExpense),
    });
  }

  async updateFixedExpense(id: string, fixedExpense: FixedExpenseUpdate): Promise<FixedExpense> {
    return this.request(`/api/v1/fixed-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fixedExpense),
    });
  }

  async deleteFixedExpense(id: string): Promise<{ message: string }> {
    return this.request(`/api/v1/fixed-expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async applyFixedExpensesForMonth(year: number, month: number): Promise<{ message: string; count: number; year: number; month: number }> {
    return this.request(`/api/v1/fixed-expenses/apply/${year}/${month}`, {
      method: 'POST',
    });
  }

  // User Budget Categories
  async getUserBudgetCategories(): Promise<{
    categories: Array<{
      key: string;
      name: string;
      description: string;
      is_user_selected: boolean;
    }>;
    is_fallback: boolean;
  }> {
    return this.request('/api/v1/budgets/categories');
  }

  // All Categories (Global)
  async getAllCategories(): Promise<{
    categories: Array<{
      key: string;
      name: string;
      description: string;
      is_user_selected: boolean;
    }>;
  }> {
    return this.request('/api/v1/budgets/all-categories');
  }

  // User Profile
  async getUserProfile(): Promise<any> {
    return this.request('/api/v1/users/me');
  }

  async updateUserProfile(profile: {
    name?: string;
    surname?: string;
    phone_number?: string;
    email?: string;
  }): Promise<any> {
    return this.request('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }
}

export const apiService = new ApiService();
