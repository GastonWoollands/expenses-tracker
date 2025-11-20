-- =============================================
-- Users Table
-- =============================================
-- Core user information table for Supabase-authenticated users
-- Uses Supabase auth.uid() directly as the primary key

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sign_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Comments
COMMENT ON TABLE users IS 'Core user information for Supabase-authenticated users';
COMMENT ON COLUMN users.id IS 'Supabase auth user ID (auth.uid())';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.display_name IS 'User display name from Supabase auth';
COMMENT ON COLUMN users.photo_url IS 'URL to user profile photo';
COMMENT ON COLUMN users.email_verified IS 'Whether email is verified in Supabase';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active';
COMMENT ON COLUMN users.last_sign_in IS 'Last sign-in timestamp';
