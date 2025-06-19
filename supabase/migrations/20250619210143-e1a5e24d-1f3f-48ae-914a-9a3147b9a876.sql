
-- Check if there's any data in circuit_quotes table
SELECT COUNT(*) as circuit_quotes_count FROM circuit_quotes;

-- Check if there's data in other related tables
SELECT COUNT(*) as carrier_quotes_count FROM carrier_quotes;

-- Show a sample of any existing circuit_quotes
SELECT id, user_id, client_name, created_at, status FROM circuit_quotes LIMIT 5;

-- Show table structure to verify we're looking at the right columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'circuit_quotes' 
AND table_schema = 'public';
