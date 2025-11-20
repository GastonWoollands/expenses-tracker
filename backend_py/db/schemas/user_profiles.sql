-- =============================================
-- User Profiles Table
-- =============================================
-- Extended user profile information and preferences
-- Separated from users table for better normalization

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL,
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    monthly_budget_limit DECIMAL(15,2),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one profile per user
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_currency ON user_profiles(default_currency_id);

-- Comments
COMMENT ON TABLE user_profiles IS 'Extended user profile information and preferences';
COMMENT ON COLUMN user_profiles.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_profiles.default_currency_id IS 'User default currency preference';
COMMENT ON COLUMN user_profiles.date_format IS 'Preferred date format for display';
COMMENT ON COLUMN user_profiles.theme IS 'UI theme preference (light/dark)';
COMMENT ON COLUMN user_profiles.notifications_enabled IS 'Whether user wants notifications';
COMMENT ON COLUMN user_profiles.monthly_budget_limit IS 'Global monthly budget limit';
COMMENT ON COLUMN user_profiles.timezone IS 'User timezone for date/time calculations';
COMMENT ON COLUMN user_profiles.language IS 'User language preference';
