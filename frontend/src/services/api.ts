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
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string): Promise<{ message: string }> {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
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
}

export const apiService = new ApiService();
