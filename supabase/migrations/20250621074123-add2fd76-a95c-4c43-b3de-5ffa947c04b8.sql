
-- Add dhcp column to circuit_quotes table
ALTER TABLE public.circuit_quotes 
ADD COLUMN dhcp boolean DEFAULT false;
