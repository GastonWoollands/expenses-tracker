-- =============================================
-- Budgets Table
-- =============================================
-- User budgets for different categories and time periods
-- Supports both category-specific and period-based budgets

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    budget_type VARCHAR(20) DEFAULT 'monthly', -- monthly, weekly, yearly, custom
    period_start DATE,
    period_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique budget per user/category/period combination
    UNIQUE(user_id, category_id, budget_type, period_start)
);

-- Indexes
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_currency_id ON budgets(currency_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_type ON budgets(budget_type);

-- Comments
COMMENT ON TABLE budgets IS 'User budgets for categories and time periods';
COMMENT ON COLUMN budgets.user_id IS 'Reference to users table';
COMMENT ON COLUMN budgets.category_id IS 'Reference to categories table (NULL for general budget)';
COMMENT ON COLUMN budgets.currency_id IS 'Currency for budget amount';
COMMENT ON COLUMN budgets.amount IS 'Budget amount (must be >= 0)';
COMMENT ON COLUMN budgets.budget_type IS 'Type of budget period (monthly, weekly, yearly, custom)';
COMMENT ON COLUMN budgets.period_start IS 'Start date for budget period';
COMMENT ON COLUMN budgets.period_end IS 'End date for budget period';
COMMENT ON COLUMN budgets.is_active IS 'Whether budget is currently active';
COMMENT ON COLUMN budgets.description IS 'Optional description for the budget';
