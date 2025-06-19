
-- Add static IP and /29 fields to circuit_quotes table
ALTER TABLE public.circuit_quotes 
ADD COLUMN static_ip boolean DEFAULT false,
ADD COLUMN slash_29 boolean DEFAULT false;
