
-- Add other_costs column to carrier_quotes table
ALTER TABLE public.carrier_quotes 
ADD COLUMN other_costs NUMERIC DEFAULT 0.00;
