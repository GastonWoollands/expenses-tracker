-- 1) Users (identified by Firebase UID)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    surname TEXT,
    phone_number TEXT UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2) Accounts of the user
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, 
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'wallet', 'other')),
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 3) Income/expense categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE, 
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name, type)
);

-- 4) Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_fixed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- 5) Budgets by category and period
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period)
);

-- 6) User income (target/expected monthly income)
CREATE TABLE IF NOT EXISTS user_income (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7) Fixed expenses (recurring templates applied by the scheduler)
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    fixed_interval VARCHAR(20) NOT NULL CHECK (fixed_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
    fixed_day_of_month INTEGER CHECK (fixed_day_of_month >= 1 AND fixed_day_of_month <= 31),
    fixed_day_of_week INTEGER CHECK (fixed_day_of_week >= 0 AND fixed_day_of_week <= 6), -- 0=Sunday, 6=Saturday
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred_at ON transactions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_income_user ON user_income(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fixed ON transactions(is_fixed);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_active ON fixed_expenses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_number_lookup ON users(phone_number);

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE users IS 'Users of the system identified by Firebase UID';
COMMENT ON COLUMN users.name IS 'User first name';
COMMENT ON COLUMN users.surname IS 'User last name';
COMMENT ON COLUMN users.phone_number IS 'User phone number (unique)';
COMMENT ON TABLE accounts IS 'Accounts of each user (cash, banks, credit cards)';
COMMENT ON TABLE categories IS 'Income and expense categories (can be global or per user)';
COMMENT ON TABLE transactions IS 'Financial transactions: expenses, income and transfers';
COMMENT ON TABLE budgets IS 'Budgets by category and period for each user';
COMMENT ON TABLE user_income IS 'Target/expected monthly income for each user';
COMMENT ON TABLE fixed_expenses IS 'Templates for recurring expenses that are applied by the scheduler';
COMMENT ON COLUMN transactions.is_fixed IS 'Whether the transaction was generated from a fixed expense';

