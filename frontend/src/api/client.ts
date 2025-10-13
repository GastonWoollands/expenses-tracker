/**
 * API client for backend communication
 */

import { supabase } from '../supabase/config'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = await this.getAuthHeaders()

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Expense endpoints
  async getExpenses(limit = 100, offset = 0) {
    return this.request(`/expenses?limit=${limit}&offset=${offset}`)
  }

  async getExpense(id: string) {
    return this.request(`/expenses/${id}`)
  }

  async createExpense(expense: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    })
  }

  async updateExpense(id: string, expense: any) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    })
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    })
  }

  // Category endpoints
  async getCategories() {
    return this.request('/categories')
  }

  // Analytics endpoints
  async getExpenseSummary(month?: number, year?: number) {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    
    return this.request(`/analytics/summary?${params.toString()}`)
  }

  async getCategoryBreakdown(month?: number, year?: number) {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    
    return this.request(`/analytics/categories?${params.toString()}`)
  }

  // Budget endpoints
  async getBudgets() {
    return this.request('/api/v1/budgets')
  }

  async createBudget(budget: any) {
    return this.request('/api/v1/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    })
  }

  async updateBudget(id: string, budget: any) {
    return this.request(`/api/v1/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    })
  }

  async deleteBudget(id: string) {
    return this.request(`/api/v1/budgets/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
