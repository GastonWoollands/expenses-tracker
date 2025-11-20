-- Add user_income table to existing database
-- This script adds the user_income table without dropping existing tables

-- Create user_income table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_income (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_income_user ON user_income(user_id);

-- Add comment
COMMENT ON TABLE user_income IS 'Target/expected monthly income for each user';

