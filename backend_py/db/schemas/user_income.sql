-- =============================================
-- User Income Table
-- =============================================
-- User income sources and amounts
-- Supports multiple income sources per user

CREATE TABLE user_income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    income_type VARCHAR(50) DEFAULT 'monthly', -- monthly, weekly, yearly, one-time
    source_name VARCHAR(100), -- Job, freelance, investment, etc.
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_income_user_id ON user_income(user_id);
CREATE INDEX idx_user_income_currency_id ON user_income(currency_id);
CREATE INDEX idx_user_income_active ON user_income(is_active);
CREATE INDEX idx_user_income_type ON user_income(income_type);
CREATE INDEX idx_user_income_dates ON user_income(start_date, end_date);

-- Comments
COMMENT ON TABLE user_income IS 'User income sources and amounts';
COMMENT ON COLUMN user_income.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_income.currency_id IS 'Currency for income amount';
COMMENT ON COLUMN user_income.amount IS 'Income amount (must be >= 0)';
COMMENT ON COLUMN user_income.income_type IS 'Type of income period (monthly, weekly, yearly, one-time)';
COMMENT ON COLUMN user_income.source_name IS 'Name of income source (job, freelance, etc.)';
COMMENT ON COLUMN user_income.is_active IS 'Whether income source is currently active';
COMMENT ON COLUMN user_income.start_date IS 'Start date for income period';
COMMENT ON COLUMN user_income.end_date IS 'End date for income period (NULL for ongoing)';
COMMENT ON COLUMN user_income.description IS 'Optional description for income source';
