
-- Add display_order column to carrier_quotes table
ALTER TABLE public.carrier_quotes 
ADD COLUMN display_order INTEGER;

-- Set initial display_order values based on creation order
UPDATE public.carrier_quotes 
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY circuit_quote_id ORDER BY created_at) as row_num
  FROM public.carrier_quotes
) sub
WHERE carrier_quotes.id = sub.id;

-- Set default value for future records
ALTER TABLE public.carrier_quotes 
ALTER COLUMN display_order SET DEFAULT 1;
