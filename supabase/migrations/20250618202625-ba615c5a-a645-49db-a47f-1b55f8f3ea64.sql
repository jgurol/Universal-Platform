
-- Add no_service column to carrier_quotes table
ALTER TABLE public.carrier_quotes 
ADD COLUMN no_service boolean DEFAULT false;
