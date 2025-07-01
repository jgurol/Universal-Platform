
-- Add completed_at field to LNP porting requests table
ALTER TABLE public.lnp_porting_requests 
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
