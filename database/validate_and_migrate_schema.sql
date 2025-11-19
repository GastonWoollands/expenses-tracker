-- =============================================
-- Script de Validación y Migración del Schema
-- =============================================
-- Este script valida y corrige el schema de la base de datos
-- para que sea compatible con Firebase UID (TEXT, no UUID)
--
-- IMPORTANTE: Este script elimina todas las tablas existentes
-- y las recrea con el schema correcto. Solo usar si no hay datos importantes.
-- =============================================

-- Paso 1: Eliminar todas las tablas existentes (en orden inverso de dependencias)
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS user_income CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Paso 2: Crear las tablas con el schema correcto para Firebase

-- 1) Usuarios (identificados por Firebase UID)
CREATE TABLE users (
    id TEXT PRIMARY KEY,                 -- UID de Firebase (TEXT, no UUID)
    email TEXT NOT NULL UNIQUE,          -- Email del usuario
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2) Cuentas del usuario
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                  -- "Caja", "Santander", "Visa"
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'wallet', 'other')),
    currency TEXT NOT NULL DEFAULT 'ARS',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)                -- Un usuario no puede tener dos cuentas con el mismo nombre
);

-- 3) Categorías de ingresos/gastos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL = categoría global
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name, type)          -- Un usuario no puede tener dos categorías iguales del mismo tipo
);

-- 4) Transacciones (gastos, ingresos y transferencias)
CREATE TABLE transactions (
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
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, period) -- Un usuario no puede tener dos presupuestos para la misma categoría y período
);

-- 6) User income (target/expected monthly income)
CREATE TABLE user_income (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Paso 3: Crear índices para optimizar consultas
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX idx_transactions_user_occurred_at ON transactions(user_id, occurred_at DESC);
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_user_income_user ON user_income(user_id);

-- Paso 4: Agregar comentarios para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema identificados por Firebase UID';
COMMENT ON TABLE accounts IS 'Cuentas financieras de cada usuario (efectivo, bancos, tarjetas)';
COMMENT ON TABLE categories IS 'Categorías de ingresos y gastos (pueden ser globales o por usuario)';
COMMENT ON TABLE transactions IS 'Transacciones financieras: gastos, ingresos y transferencias';
COMMENT ON TABLE budgets IS 'Presupuestos por categoría y período para cada usuario';
COMMENT ON TABLE user_income IS 'Income objetivo/mensual de cada usuario';

-- Paso 5: Validar el schema creado
DO $$
DECLARE
    users_id_type TEXT;
    accounts_user_id_type TEXT;
    categories_user_id_type TEXT;
    transactions_user_id_type TEXT;
    budgets_user_id_type TEXT;
BEGIN
    -- Verificar users.id
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id';
    
    IF users_id_type != 'text' THEN
        RAISE EXCEPTION 'ERROR: users.id debe ser TEXT, pero es %', users_id_type;
    END IF;
    
    -- Verificar user_id en todas las tablas relacionadas
    SELECT data_type INTO accounts_user_id_type
    FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'user_id';
    
    IF accounts_user_id_type != 'text' THEN
        RAISE EXCEPTION 'ERROR: accounts.user_id debe ser TEXT, pero es %', accounts_user_id_type;
    END IF;
    
    SELECT data_type INTO categories_user_id_type
    FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'user_id';
    
    IF categories_user_id_type != 'text' THEN
        RAISE EXCEPTION 'ERROR: categories.user_id debe ser TEXT, pero es %', categories_user_id_type;
    END IF;
    
    SELECT data_type INTO transactions_user_id_type
    FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'user_id';
    
    IF transactions_user_id_type != 'text' THEN
        RAISE EXCEPTION 'ERROR: transactions.user_id debe ser TEXT, pero es %', transactions_user_id_type;
    END IF;
    
    SELECT data_type INTO budgets_user_id_type
    FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'user_id';
    
    IF budgets_user_id_type != 'text' THEN
        RAISE EXCEPTION 'ERROR: budgets.user_id debe ser TEXT, pero es %', budgets_user_id_type;
    END IF;
    
    RAISE NOTICE '✅ Schema validado correctamente:';
    RAISE NOTICE '   - users.id: %', users_id_type;
    RAISE NOTICE '   - accounts.user_id: %', accounts_user_id_type;
    RAISE NOTICE '   - categories.user_id: %', categories_user_id_type;
    RAISE NOTICE '   - transactions.user_id: %', transactions_user_id_type;
    RAISE NOTICE '   - budgets.user_id: %', budgets_user_id_type;
    RAISE NOTICE '✅ Todas las tablas están listas para usar Firebase UID';
END $$;

-- Mostrar resumen final
SELECT 
    'users' as tabla,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('id', 'email')
UNION ALL
SELECT 
    'accounts' as tabla,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'accounts' AND column_name = 'user_id'
UNION ALL
SELECT 
    'categories' as tabla,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'categories' AND column_name = 'user_id'
UNION ALL
SELECT 
    'transactions' as tabla,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'user_id'
UNION ALL
SELECT 
    'budgets' as tabla,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'budgets' AND column_name = 'user_id'
ORDER BY tabla, column_name;

