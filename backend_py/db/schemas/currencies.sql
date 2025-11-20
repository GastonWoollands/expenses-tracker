-- =============================================
-- Currencies Table
-- =============================================
-- Currency reference table for multi-currency support
-- Normalizes currency codes and provides exchange rate capabilities

CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL, -- ISO 4217 currency code (USD, EUR, etc.)
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_currencies_code ON currencies(code);
CREATE INDEX idx_currencies_active ON currencies(is_active);

-- Insert common currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('JPY', 'Japanese Yen', '¥', 0),
('CAD', 'Canadian Dollar', 'C$', 2),
('AUD', 'Australian Dollar', 'A$', 2),
('CHF', 'Swiss Franc', 'CHF', 2),
('CNY', 'Chinese Yuan', '¥', 2),
('SEK', 'Swedish Krona', 'kr', 2),
('NOK', 'Norwegian Krone', 'kr', 2),
('DKK', 'Danish Krone', 'kr', 2),
('PLN', 'Polish Zloty', 'zł', 2),
('CZK', 'Czech Koruna', 'Kč', 2),
('HUF', 'Hungarian Forint', 'Ft', 2),
('RUB', 'Russian Ruble', '₽', 2),
('BRL', 'Brazilian Real', 'R$', 2),
('MXN', 'Mexican Peso', '$', 2),
('INR', 'Indian Rupee', '₹', 2),
('KRW', 'South Korean Won', '₩', 0),
('SGD', 'Singapore Dollar', 'S$', 2),
('HKD', 'Hong Kong Dollar', 'HK$', 2),
('NZD', 'New Zealand Dollar', 'NZ$', 2),
('ZAR', 'South African Rand', 'R', 2),
('TRY', 'Turkish Lira', '₺', 2),
('ILS', 'Israeli Shekel', '₪', 2);

-- Comments
COMMENT ON TABLE currencies IS 'Currency reference table for multi-currency support';
COMMENT ON COLUMN currencies.code IS 'ISO 4217 currency code (3 characters)';
COMMENT ON COLUMN currencies.name IS 'Full currency name';
COMMENT ON COLUMN currencies.symbol IS 'Currency symbol for display';
COMMENT ON COLUMN currencies.decimal_places IS 'Number of decimal places for this currency';
COMMENT ON COLUMN currencies.is_active IS 'Whether currency is currently active';
