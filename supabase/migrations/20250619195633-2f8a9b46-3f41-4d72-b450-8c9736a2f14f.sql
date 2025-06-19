
-- Add mikrotik_required column to circuit_quotes table
ALTER TABLE public.circuit_quotes ADD COLUMN mikrotik_required boolean DEFAULT false;
