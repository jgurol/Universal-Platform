
-- Add FOC date field to LNP porting requests table
ALTER TABLE public.lnp_porting_requests 
ADD COLUMN foc_date DATE;
