-- =============================================
-- Migration to Supabase Users Only
-- =============================================
-- This script migrates from Firebase user mapping to pure Supabase users
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can manage own income" ON user_income;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own attachments" ON transaction_attachments;

-- Step 2: Update users table structure
-- First, create a backup of existing data
CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop the firebase_uid column and related constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_firebase_uid_key;
ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;

-- Update the id column to use auth.uid() as default
ALTER TABLE users ALTER COLUMN id SET DEFAULT auth.uid();

-- Step 3: Update all foreign key references
-- Update user_profiles table
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update budgets table
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update user_income table
ALTER TABLE user_income DROP CONSTRAINT IF EXISTS user_income_user_id_fkey;
ALTER TABLE user_income ADD CONSTRAINT user_income_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update transactions table
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update transaction_attachments table
ALTER TABLE transaction_attachments DROP CONSTRAINT IF EXISTS transaction_attachments_transaction_id_fkey;
ALTER TABLE transaction_attachments ADD CONSTRAINT transaction_attachments_transaction_id_fkey 
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;

-- Step 4: Create new RLS policies
-- Users table policies - use auth.uid() directly as the primary key
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- All other tables use auth.uid() directly as user_id
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own income" ON user_income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own attachments" ON transaction_attachments FOR ALL USING (
    auth.uid() = (SELECT user_id FROM transactions WHERE id = transaction_id)
);

-- Step 5: Clean up
-- Drop the backup table (uncomment when you're sure everything works)
-- DROP TABLE users_backup;

-- =============================================
-- Verification
-- =============================================

-- Check that all policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'user_profiles', 'budgets', 'user_income', 'transactions', 'transaction_attachments')
ORDER BY tablename, policyname;

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('user_profiles', 'budgets', 'user_income', 'transactions', 'transaction_attachments')
ORDER BY tc.table_name, kcu.column_name;
