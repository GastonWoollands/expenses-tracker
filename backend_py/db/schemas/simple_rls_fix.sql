-- =============================================
-- Clean RLS Policies for Supabase Users Only
-- =============================================
-- This script creates clean RLS policies that work directly with Supabase auth
-- No Firebase user mapping - just pure Supabase users

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can manage own income" ON user_income;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own attachments" ON transaction_attachments;

-- Create clean policies that work with Supabase auth
-- All tables use auth.uid() directly as user_id

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

-- =============================================
-- Verify Policies
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
