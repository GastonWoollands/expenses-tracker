-- =============================================
-- Exchange Rates Table
-- =============================================
-- Exchange rates for currency conversion
-- Supports historical rates and real-time updates

CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    to_currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    rate DECIMAL(20,8) NOT NULL CHECK (rate > 0),
    effective_date DATE NOT NULL,
    source VARCHAR(50), -- API source (e.g., 'fixer.io', 'openexchangerates')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique rate per currency pair per date
    UNIQUE(from_currency_id, to_currency_id, effective_date)
);

-- Indexes
CREATE INDEX idx_exchange_rates_from_currency ON exchange_rates(from_currency_id);
CREATE INDEX idx_exchange_rates_to_currency ON exchange_rates(to_currency_id);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date);
CREATE INDEX idx_exchange_rates_currencies_date ON exchange_rates(from_currency_id, to_currency_id, effective_date);

-- Comments
COMMENT ON TABLE exchange_rates IS 'Exchange rates for currency conversion';
COMMENT ON COLUMN exchange_rates.from_currency_id IS 'Source currency';
COMMENT ON COLUMN exchange_rates.to_currency_id IS 'Target currency';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate (from_currency to to_currency)';
COMMENT ON COLUMN exchange_rates.effective_date IS 'Date when rate is effective';
COMMENT ON COLUMN exchange_rates.source IS 'Source of the exchange rate data';
