-- Insert initial exchange rates (sample data)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('INR', 'USD', 0.012),
('INR', 'GBP', 0.0095),
('INR', 'NGN', 19.5),
('INR', 'IDR', 185.0)
ON CONFLICT (from_currency, to_currency) DO UPDATE SET
rate = EXCLUDED.rate,
last_updated = CURRENT_TIMESTAMP;
