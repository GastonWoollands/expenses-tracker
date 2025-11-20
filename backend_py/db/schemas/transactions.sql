-- =============================================
-- Transactions Table
-- =============================================
-- Core financial transactions (expenses and income)
-- Unified table for all monetary transactions with proper categorization

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('expense', 'income', 'transfer')),
    description VARCHAR(500) NOT NULL,
    transaction_date DATE NOT NULL,
    is_fixed BOOLEAN DEFAULT FALSE, -- For recurring transactions
    fixed_interval VARCHAR(20), -- daily, weekly, monthly, yearly
    fixed_day_of_month INTEGER CHECK (fixed_day_of_month >= 1 AND fixed_day_of_month <= 31),
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[], -- Array of tags for better organization
    metadata JSONB, -- Flexible metadata storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_currency_id ON transactions(currency_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_fixed ON transactions(is_fixed);
CREATE INDEX idx_transactions_active ON transactions(is_active);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN(metadata);

-- Comments
COMMENT ON TABLE transactions IS 'Core financial transactions (expenses and income)';
COMMENT ON COLUMN transactions.user_id IS 'Reference to users table';
COMMENT ON COLUMN transactions.category_id IS 'Reference to categories table';
COMMENT ON COLUMN transactions.currency_id IS 'Currency for transaction amount';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount (must be > 0)';
COMMENT ON COLUMN transactions.transaction_type IS 'Type of transaction (expense, income, transfer)';
COMMENT ON COLUMN transactions.description IS 'Transaction description';
COMMENT ON COLUMN transactions.transaction_date IS 'Date when transaction occurred';
COMMENT ON COLUMN transactions.is_fixed IS 'Whether this is a recurring transaction';
COMMENT ON COLUMN transactions.fixed_interval IS 'Interval for recurring transactions';
COMMENT ON COLUMN transactions.fixed_day_of_month IS 'Day of month for monthly recurring transactions';
COMMENT ON COLUMN transactions.is_active IS 'Whether transaction is currently active';
COMMENT ON COLUMN transactions.tags IS 'Array of tags for organization and filtering';
COMMENT ON COLUMN transactions.metadata IS 'Flexible JSON metadata storage';
