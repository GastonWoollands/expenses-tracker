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
  async getExpenses(limit = 100, offset = 0): Promise<Expense[]> {
    console.log('API: Getting expenses with limit:', limit, 'offset:', offset);
    const result = await this.request<Expense[]>(`/expenses?limit=${limit}&offset=${offset}`);
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

  async getCategoryBreakdown(month?: number, year?: number): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    return this.request(`/analytics/categories?${params.toString()}`);
  }

  // Fixed Expenses
  async getFixedExpenses(): Promise<any[]> {
    return this.request('/fixed-expenses');
  }

  async createFixedExpense(fixedExpense: any): Promise<any> {
    return this.request('/fixed-expenses', {
      method: 'POST',
      body: JSON.stringify(fixedExpense),
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

  // TrueLayer Integration
  async getTrueLayerAuthLink(): Promise<{ auth_url: string }> {
    return this.request('/api/truelayer/auth/link');
  }

  async getTrueLayerStatus(): Promise<{ connected: boolean }> {
    return this.request('/api/truelayer/status');
  }

  async getTrueLayerAccounts(): Promise<{ accounts: any[] }> {
    return this.request('/api/truelayer/accounts');
  }

  async getTrueLayerTransactions(accountId: string, fromDate?: string, toDate?: string): Promise<{ transactions: any[] }> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const query = params.toString();
    return this.request(`/api/truelayer/accounts/${accountId}/transactions${query ? `?${query}` : ''}`);
  }

  async syncTrueLayerTransactions(accountId?: string, fromDate?: string, toDate?: string): Promise<{ message: string; synced: number; errors?: string[] }> {
    return this.request('/api/truelayer/sync', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, from_date: fromDate, to_date: toDate }),
    });
  }

  async disconnectTrueLayer(): Promise<{ message: string }> {
    return this.request('/api/truelayer/disconnect', {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
