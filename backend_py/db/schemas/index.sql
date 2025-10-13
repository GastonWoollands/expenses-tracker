-- =============================================
-- Expenses Tracker Database Schema
-- =============================================
-- Complete PostgreSQL schema for Supabase migration
-- 
-- This file combines all schema files in the correct dependency order:
-- 1. Extensions and base setup
-- 2. Core reference tables (currencies, categories)
-- 3. User-related tables (users, user_profiles)
-- 4. Financial tables (budgets, user_income, transactions)
-- 5. Supporting tables (exchange_rates, attachments, audit_log)
-- 6. Triggers and functions
--
-- Usage: Run this file in your Supabase SQL editor or via psql
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- Core Reference Tables
-- =============================================

-- Currencies table (must be first - referenced by other tables)
\i currencies.sql

-- Categories table (referenced by transactions and budgets)
\i categories.sql

-- =============================================
-- User Management Tables
-- =============================================

-- Users table (core user information)
\i users.sql

-- User profiles table (extended user preferences)
\i user_profiles.sql

-- =============================================
-- Financial Tables
-- =============================================

-- Budgets table (user budgets by category/period)
\i budgets.sql

-- User income table (income sources and amounts)
\i user_income.sql

-- Transactions table (core financial transactions)
\i transactions.sql

-- =============================================
-- Supporting Tables
-- =============================================

-- Exchange rates table (currency conversion)
\i exchange_rates.sql

-- Transaction attachments table (file attachments)
\i transaction_attachments.sql

-- Audit log table (data change tracking)
\i audit_log.sql

-- =============================================
-- Triggers and Functions
-- =============================================

-- Automatic timestamp updates and audit logging
\i triggers.sql

-- =============================================
-- Additional Indexes for Performance
-- =============================================

-- Composite indexes for common queries
CREATE INDEX idx_transactions_user_date_type ON transactions(user_id, transaction_date, transaction_type);
CREATE INDEX idx_transactions_user_category_date ON transactions(user_id, category_id, transaction_date);
CREATE INDEX idx_budgets_user_category_active ON budgets(user_id, category_id, is_active);
CREATE INDEX idx_user_income_user_active ON user_income(user_id, is_active);

-- =============================================
-- Views for Common Queries
-- =============================================

-- View for transaction summaries with category and currency info
CREATE VIEW transaction_summary AS
SELECT 
    t.id,
    t.user_id,
    t.amount,
    t.transaction_type,
    t.description,
    t.transaction_date,
    t.is_fixed,
    t.tags,
    c.name as category_name,
    c.key as category_key,
    c.icon as category_icon,
    c.color as category_color,
    curr.code as currency_code,
    curr.symbol as currency_symbol,
    t.created_at,
    t.updated_at
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN currencies curr ON t.currency_id = curr.id
WHERE t.is_active = true;

-- View for budget vs actual spending
CREATE VIEW budget_vs_actual AS
SELECT 
    b.id as budget_id,
    b.user_id,
    b.category_id,
    c.name as category_name,
    b.amount as budget_amount,
    b.currency_id,
    curr.code as currency_code,
    b.budget_type,
    b.period_start,
    b.period_end,
    COALESCE(SUM(t.amount), 0) as actual_spent,
    b.amount - COALESCE(SUM(t.amount), 0) as remaining_budget,
    CASE 
        WHEN b.amount > 0 THEN 
            ROUND((COALESCE(SUM(t.amount), 0) / b.amount) * 100, 2)
        ELSE 0 
    END as percentage_used
FROM budgets b
LEFT JOIN categories c ON b.category_id = c.id
LEFT JOIN currencies curr ON b.currency_id = curr.id
LEFT JOIN transactions t ON (
    t.user_id = b.user_id 
    AND t.category_id = b.category_id 
    AND t.transaction_type = 'expense'
    AND t.transaction_date >= COALESCE(b.period_start, DATE_TRUNC('month', CURRENT_DATE))
    AND t.transaction_date <= COALESCE(b.period_end, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
    AND t.is_active = true
)
WHERE b.is_active = true
GROUP BY b.id, b.user_id, b.category_id, c.name, b.amount, b.currency_id, curr.code, b.budget_type, b.period_start, b.period_end;

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = firebase_uid);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can manage own income" ON user_income FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can manage own attachments" ON transaction_attachments FOR ALL USING (
    auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = (SELECT user_id FROM transactions WHERE id = transaction_id))
);

-- =============================================
-- Comments
-- =============================================

COMMENT ON SCHEMA public IS 'Expenses Tracker Database Schema - Complete PostgreSQL schema for personal finance tracking';

-- =============================================
-- Schema Creation Complete
-- =============================================

-- The schema is now ready for use with Supabase
-- All tables, indexes, triggers, and policies are in place
-- Run this file in your Supabase SQL editor to create the complete database structure
