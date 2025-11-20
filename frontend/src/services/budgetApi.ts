/**
 * Budget API service for managing budgets and income
 */

import { apiService } from './api';

export interface Budget {
  id: string;
  user_id: string;
  category_key: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  category_key: string;
  amount: number;
}

export interface BudgetUpdate {
  amount?: number;
}

export interface UserIncome {
  income: number;
}

class BudgetApiService {
  private baseUrl = '/api/v1';

  /**
   * Get all budgets for the current user
   */
  async getBudgets(): Promise<Budget[]> {
    return apiService.request<Budget[]>(`${this.baseUrl}/budgets`);
  }

  /**
   * Create a new budget
   */
  async createBudget(budget: BudgetCreate): Promise<Budget> {
    return apiService.request<Budget>(`${this.baseUrl}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(budget),
    });
  }

  /**
   * Update an existing budget
   */
  async updateBudget(budgetId: string, budget: BudgetUpdate): Promise<Budget> {
    return apiService.request<Budget>(`${this.baseUrl}/budgets/${budgetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(budget),
    });
  }

  /**
   * Delete a budget
   */
  async deleteBudget(budgetId: string): Promise<void> {
    return apiService.request<void>(`${this.baseUrl}/budgets/${budgetId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get budget for a specific category
   */
  async getBudgetByCategory(categoryKey: string): Promise<Budget | { category: string; amount: number }> {
    return apiService.request<Budget | { category: string; amount: number }>(`${this.baseUrl}/budgets/category/${categoryKey}`);
  }

  /**
   * Update budget for a specific category
   */
  async updateBudgetByCategory(categoryKey: string, amount: number): Promise<Budget> {
    return apiService.request<Budget>(`${this.baseUrl}/budgets/category/${categoryKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Get user's monthly income
   */
  async getIncome(): Promise<UserIncome> {
    return apiService.request<UserIncome>(`${this.baseUrl}/income`);
  }

  /**
   * Update user's monthly income
   */
  async updateIncome(income: number): Promise<UserIncome> {
    return apiService.request<UserIncome>(`${this.baseUrl}/income`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ income }),
    });
  }
}

export const budgetApiService = new BudgetApiService();
