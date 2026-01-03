-- =============================================
-- Expenses Tracker Database Schema (Standalone)
-- =============================================
-- Complete PostgreSQL schema for Supabase migration
-- 
-- This is a standalone version that includes all schema definitions
-- in a single file for easy deployment to Supabase
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- Core Reference Tables
-- =============================================

-- Currencies table
CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_currencies_code ON currencies(code);
CREATE INDEX idx_currencies_active ON currencies(is_active);

-- Insert common currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2), ('EUR', 'Euro', '€', 2), ('GBP', 'British Pound', '£', 2),
('JPY', 'Japanese Yen', '¥', 0), ('CAD', 'Canadian Dollar', 'C$', 2), ('AUD', 'Australian Dollar', 'A$', 2),
('CHF', 'Swiss Franc', 'CHF', 2), ('CNY', 'Chinese Yuan', '¥', 2), ('SEK', 'Swedish Krona', 'kr', 2),
('NOK', 'Norwegian Krone', 'kr', 2), ('DKK', 'Danish Krone', 'kr', 2), ('PLN', 'Polish Zloty', 'zł', 2),
('CZK', 'Czech Koruna', 'Kč', 2), ('HUF', 'Hungarian Forint', 'Ft', 2), ('RUB', 'Russian Ruble', '₽', 2),
('BRL', 'Brazilian Real', 'R$', 2), ('MXN', 'Mexican Peso', '$', 2), ('INR', 'Indian Rupee', '₹', 2),
('KRW', 'South Korean Won', '₩', 0), ('SGD', 'Singapore Dollar', 'S$', 2), ('HKD', 'Hong Kong Dollar', 'HK$', 2),
('NZD', 'New Zealand Dollar', 'NZ$', 2), ('ZAR', 'South African Rand', 'R', 2), ('TRY', 'Turkish Lira', '₺', 2),
('ILS', 'Israeli Shekel', '₪', 2);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_key ON categories(key);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Insert all 65 categories
-- Core categories (default selected) - sort_order 1-13
-- Additional categories (unselected by default) - sort_order 14+
INSERT INTO categories (key, name, description, icon, color, sort_order) VALUES
-- === CORE CATEGORIES (DEFAULT SELECTED) ===
('food', 'Food', 'groceries, supermarket, etc.', 'food', '#FF6B6B', 1),
('subscription', 'Subscription', 'Netflix, Cursor, etc.', 'subscription', '#4ECDC4', 2),
('transport', 'Transport', 'Uber, train, bus, Bike, Bicing, etc.', 'transport', '#45B7D1', 3),
('housing', 'Housing', 'rent, mortgage, etc.', 'housing', '#96CEB4', 4),
('services', 'Services', 'electricity, water, internet, etc.', 'services', '#FFEAA7', 5),
('health', 'Health', 'gym, yoga, pharmacy, etc.', 'health', '#DDA0DD', 6),
('education', 'Education', 'courses, etc.', 'education', '#98D8C8', 7),
('technology', 'Technology', 'expenses in technology, etc.', 'technology', '#F7DC6F', 8),
('shopping', 'Shopping', 'Amazon, clothes, accessories, etc.', 'shopping', '#BB8FCE', 9),
('travel', 'Travel', 'flights, hotels, etc.', 'travel', '#85C1E9', 10),
('bar_restaurant', 'Bar and restaurant', 'bars, restaurants, cafes, etc.', 'restaurant', '#F8C471', 11),
('hobby', 'Hobby', 'hobbies, socials, etc.', 'hobby', '#82E0AA', 12),
('other', 'Other', 'other expenses', 'other', '#D5DBDB', 13),

-- === ADDITIONAL CATEGORIES (UNSELECTED BY DEFAULT) ===
-- Personal Care & Beauty
('personal_care', 'Personal Care', 'haircuts, skincare, cosmetics, spa, etc.', 'user', '#FFB6C1', 14),
('beauty', 'Beauty', 'makeup, skincare products, salon visits, etc.', 'sparkles', '#FF69B4', 15),

-- Financial & Insurance
('insurance', 'Insurance', 'health, car, home, life insurance, etc.', 'shield', '#32CD32', 16),
('banking', 'Banking', 'bank fees, ATM fees, wire transfers, etc.', 'credit-card', '#4169E1', 17),
('investments', 'Investments', 'stocks, bonds, crypto, investment fees, etc.', 'trending-up', '#00CED1', 18),
('taxes', 'Taxes', 'income tax, property tax, business tax, etc.', 'file-text', '#DC143C', 19),

-- Transportation (Detailed)
('fuel', 'Fuel', 'gas, diesel, electric charging, etc.', 'fuel', '#FFD700', 20),
('vehicle_maintenance', 'Vehicle Maintenance', 'car repairs, oil changes, tires, etc.', 'wrench', '#8B4513', 21),
('parking', 'Parking', 'parking fees, garage, street parking, etc.', 'square', '#696969', 22),
('public_transport', 'Public Transport', 'metro, bus, tram, ferry, etc.', 'bus', '#1E90FF', 23),

-- Home & Living
('furniture', 'Furniture', 'sofas, tables, chairs, home decor, etc.', 'home', '#DEB887', 24),
('appliances', 'Appliances', 'refrigerator, washing machine, TV, etc.', 'tv', '#A0522D', 25),
('home_improvement', 'Home Improvement', 'renovations, repairs, tools, etc.', 'hammer', '#CD853F', 26),
('cleaning', 'Cleaning', 'cleaning supplies, housekeeping, laundry, etc.', 'spray', '#F0E68C', 27),
('garden', 'Garden', 'plants, gardening tools, landscaping, etc.', 'leaf', '#90EE90', 28),

-- Entertainment & Media
('entertainment', 'Entertainment', 'movies, concerts, shows, events, etc.', 'film', '#FF1493', 29),
('gaming', 'Gaming', 'video games, gaming equipment, subscriptions, etc.', 'gamepad2', '#9370DB', 30),
('books', 'Books', 'books, e-books, magazines, newspapers, etc.', 'book', '#8B008B', 31),
('music', 'Music', 'music streaming, concerts, instruments, etc.', 'music', '#FF4500', 32),
('sports', 'Sports', 'sports equipment, gym memberships, sports events, etc.', 'trophy', '#FF6347', 33),

-- Work & Business
('office', 'Office', 'office supplies, equipment, workspace, etc.', 'briefcase', '#2E8B57', 34),
('business', 'Business', 'business expenses, professional services, etc.', 'building', '#4682B4', 35),
('communication', 'Communication', 'phone bills, internet, postage, etc.', 'phone', '#20B2AA', 36),
('software', 'Software', 'software licenses, apps, productivity tools, etc.', 'code', '#6A5ACD', 37),

-- Family & Relationships
('childcare', 'Childcare', 'babysitting, daycare, school supplies, etc.', 'baby', '#FFB6C1', 38),
('pets', 'Pets', 'pet food, vet bills, pet supplies, grooming, etc.', 'heart', '#FF69B4', 39),
('gifts', 'Gifts', 'birthday gifts, holiday gifts, donations, etc.', 'gift', '#FFD700', 40),
('charity', 'Charity', 'donations, charity events, fundraising, etc.', 'heart-handshake', '#DC143C', 41),

-- Health & Wellness (Detailed)
('medical', 'Medical', 'doctor visits, medical tests, prescriptions, etc.', 'stethoscope', '#FF0000', 42),
('dental', 'Dental', 'dental checkups, treatments, orthodontics, etc.', 'smile', '#FFFFFF', 43),
('vision', 'Vision', 'eye exams, glasses, contact lenses, etc.', 'eye', '#0000FF', 44),
('mental_health', 'Mental Health', 'therapy, counseling, mental health apps, etc.', 'brain', '#800080', 45),
('fitness', 'Fitness', 'gym memberships, personal training, fitness classes, etc.', 'dumbbell', '#00FF00', 46),

-- Food & Dining (Detailed)
('groceries', 'Groceries', 'supermarket shopping, food delivery, etc.', 'shopping-cart', '#32CD32', 47),
('dining_out', 'Dining Out', 'restaurants, cafes, food trucks, etc.', 'utensils', '#FF8C00', 48),
('coffee', 'Coffee', 'coffee shops, coffee beans, coffee equipment, etc.', 'coffee', '#8B4513', 49),
('alcohol', 'Alcohol', 'wine, beer, spirits, bars, etc.', 'wine', '#800000', 50),

-- Travel & Leisure (Detailed)
('accommodation', 'Accommodation', 'hotels, Airbnb, hostels, etc.', 'bed', '#4169E1', 51),
('flights', 'Flights', 'airline tickets, baggage fees, etc.', 'plane', '#87CEEB', 52),
('car_rental', 'Car Rental', 'rental cars, car sharing, etc.', 'car', '#B0C4DE', 53),
('activities', 'Activities', 'tours, attractions, adventure activities, etc.', 'map', '#FFA500', 54),

-- Utilities & Services (Detailed)
('electricity', 'Electricity', 'electric bills, power consumption, etc.', 'zap', '#FFFF00', 55),
('water', 'Water', 'water bills, water delivery, etc.', 'droplet', '#00BFFF', 56),
('gas', 'Gas', 'natural gas, propane, heating, etc.', 'flame', '#FF4500', 57),
('internet', 'Internet', 'internet service, WiFi, data plans, etc.', 'wifi', '#0000FF', 58),
('phone', 'Phone', 'mobile phone bills, landline, etc.', 'phone', '#32CD32', 59),
('cable', 'Cable', 'cable TV, satellite, streaming services, etc.', 'tv', '#696969', 60),

-- Miscellaneous
('legal', 'Legal', 'lawyer fees, legal documents, notary, etc.', 'scale', '#800080', 61),
('emergency', 'Emergency', 'emergency expenses, urgent repairs, etc.', 'alert-triangle', '#FF0000', 62),
('fees', 'Fees', 'service fees, processing fees, late fees, etc.', 'receipt', '#808080', 63),
('memberships', 'Memberships', 'club memberships, professional associations, etc.', 'users', '#4B0082', 64),
('subscriptions_other', 'Other Subscriptions', 'newsletters, premium content, etc.', 'mail', '#FF1493', 65);

-- =============================================
-- User Management Tables
-- =============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sign_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User profiles table
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
    UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_currency ON user_profiles(default_currency_id);

-- =============================================
-- Financial Tables
-- =============================================

-- Budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    budget_type VARCHAR(20) DEFAULT 'monthly',
    period_start DATE,
    period_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, budget_type, period_start)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_currency_id ON budgets(currency_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_type ON budgets(budget_type);

-- User income table
CREATE TABLE user_income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    income_type VARCHAR(50) DEFAULT 'monthly',
    source_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_income_user_id ON user_income(user_id);
CREATE INDEX idx_user_income_currency_id ON user_income(currency_id);
CREATE INDEX idx_user_income_active ON user_income(is_active);
CREATE INDEX idx_user_income_type ON user_income(income_type);
CREATE INDEX idx_user_income_dates ON user_income(start_date, end_date);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('expense', 'income', 'transfer')),
    description VARCHAR(500) NOT NULL,
    transaction_date DATE NOT NULL,
    is_fixed BOOLEAN DEFAULT FALSE,
    fixed_interval VARCHAR(20),
    fixed_day_of_month INTEGER CHECK (fixed_day_of_month >= 1 AND fixed_day_of_month <= 31),
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_currency_id ON transactions(currency_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_fixed ON transactions(is_fixed);
CREATE INDEX idx_transactions_active ON transactions(is_active);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN(metadata);

-- =============================================
-- Fixed Expenses Table
-- =============================================
-- Templates for recurring expenses that are applied by the scheduler
CREATE TABLE fixed_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    fixed_interval VARCHAR(20) NOT NULL CHECK (fixed_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
    fixed_day_of_month INTEGER CHECK (fixed_day_of_month >= 1 AND fixed_day_of_month <= 31),
    fixed_day_of_week INTEGER CHECK (fixed_day_of_week >= 0 AND fixed_day_of_week <= 6),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX idx_fixed_expenses_category_id ON fixed_expenses(category_id);
CREATE INDEX idx_fixed_expenses_active ON fixed_expenses(is_active);
CREATE INDEX idx_fixed_expenses_user_active ON fixed_expenses(user_id, is_active);

-- =============================================
-- Supporting Tables
-- =============================================

-- Exchange rates table
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    to_currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    rate DECIMAL(20,8) NOT NULL CHECK (rate > 0),
    effective_date DATE NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency_id, to_currency_id, effective_date)
);

CREATE INDEX idx_exchange_rates_from_currency ON exchange_rates(from_currency_id);
CREATE INDEX idx_exchange_rates_to_currency ON exchange_rates(to_currency_id);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date);
CREATE INDEX idx_exchange_rates_currencies_date ON exchange_rates(from_currency_id, to_currency_id, effective_date);

-- Transaction attachments table
CREATE TABLE transaction_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transaction_attachments_transaction_id ON transaction_attachments(transaction_id);
CREATE INDEX idx_transaction_attachments_uploaded_at ON transaction_attachments(uploaded_at);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- =============================================
-- Triggers and Functions
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
            IF old_data->field_name IS DISTINCT FROM new_data->field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    INSERT INTO audit_log (
        table_name, record_id, operation, user_id,
        old_values, new_values, changed_fields
    ) VALUES (
        TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP,
        CASE 
            WHEN TG_TABLE_NAME IN ('users', 'user_profiles', 'budgets', 'user_income', 'transactions', 'transaction_attachments') 
            THEN COALESCE(NEW.user_id, OLD.user_id)
            ELSE NULL
        END,
        old_data, new_data, changed_fields
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_income_updated_at BEFORE UPDATE ON user_income FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON categories FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_user_profiles AFTER INSERT OR UPDATE OR DELETE ON user_profiles FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_budgets AFTER INSERT OR UPDATE OR DELETE ON budgets FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_user_income AFTER INSERT OR UPDATE OR DELETE ON user_income FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =============================================
-- Additional Indexes and Views
-- =============================================

-- Composite indexes
CREATE INDEX idx_transactions_user_date_type ON transactions(user_id, transaction_date, transaction_type);
CREATE INDEX idx_transactions_user_category_date ON transactions(user_id, category_id, transaction_date);
CREATE INDEX idx_budgets_user_category_active ON budgets(user_id, category_id, is_active);
CREATE INDEX idx_user_income_user_active ON user_income(user_id, is_active);

-- Views
CREATE VIEW transaction_summary AS
SELECT 
    t.id, t.user_id, t.amount, t.transaction_type, t.description, t.transaction_date,
    t.is_fixed, t.tags, c.name as category_name, c.key as category_key,
    c.icon as category_icon, c.color as category_color,
    curr.code as currency_code, curr.symbol as currency_symbol,
    t.created_at, t.updated_at
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN currencies curr ON t.currency_id = curr.id
WHERE t.is_active = true;

CREATE VIEW budget_vs_actual AS
SELECT 
    b.id as budget_id, b.user_id, b.category_id, c.name as category_name,
    b.amount as budget_amount, b.currency_id, curr.code as currency_code,
    b.budget_type, b.period_start, b.period_end,
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
    t.user_id = b.user_id AND t.category_id = b.category_id 
    AND t.transaction_type = 'expense' AND t.is_active = true
    AND t.transaction_date >= COALESCE(b.period_start, DATE_TRUNC('month', CURRENT_DATE))
    AND t.transaction_date <= COALESCE(b.period_end, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
)
WHERE b.is_active = true
GROUP BY b.id, b.user_id, b.category_id, c.name, b.amount, b.currency_id, curr.code, b.budget_type, b.period_start, b.period_end;

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = firebase_uid);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = firebase_uid);
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));
CREATE POLICY "Users can manage own income" ON user_income FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));
CREATE POLICY "Users can manage own attachments" ON transaction_attachments FOR ALL USING (
    auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = (SELECT user_id FROM transactions WHERE id = transaction_id))
);

-- Schema creation complete!
