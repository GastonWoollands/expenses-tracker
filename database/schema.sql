-- =============================================
-- Schema Expense Tracker para PostgreSQL (Neon)
-- =============================================
-- Este script crea todas las tablas necesarias para el sistema
-- de tracking de gastos con soporte para múltiples usuarios (Firebase)
--
-- Ejecutar este script en Neon PostgreSQL para inicializar la base de datos
-- =============================================

-- 1) Usuarios (identificados por Firebase UID)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                 -- UID de Firebase (puede ser UUID o string)
    email TEXT NOT NULL UNIQUE,          -- opcional para referencia rápida
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2) Cuentas del usuario
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                  -- "Caja", "Santander", "Visa"
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'wallet', 'other')),
    currency TEXT NOT NULL DEFAULT 'ARS',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)                -- Un usuario no puede tener dos cuentas con el mismo nombre
);

-- 3) Categorías de ingresos/gastos
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL = categoría global
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name, type)          -- Un usuario no puede tener dos categorías iguales del mismo tipo
);

-- 4) Transacciones (gastos, ingresos y transferencias)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    description TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- 5) Presupuestos por usuario y categoría
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period) -- Un usuario no puede tener dos presupuestos para la misma categoría y período
);

-- =============================================
-- Índices recomendados para consultas frecuentes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred_at ON transactions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- =============================================
-- Comentarios en las tablas para documentación
-- =============================================
COMMENT ON TABLE users IS 'Usuarios del sistema identificados por Firebase UID';
COMMENT ON TABLE accounts IS 'Cuentas financieras de cada usuario (efectivo, bancos, tarjetas)';
COMMENT ON TABLE categories IS 'Categorías de ingresos y gastos (pueden ser globales o por usuario)';
COMMENT ON TABLE transactions IS 'Transacciones financieras: gastos, ingresos y transferencias';
COMMENT ON TABLE budgets IS 'Presupuestos por categoría y período para cada usuario';

