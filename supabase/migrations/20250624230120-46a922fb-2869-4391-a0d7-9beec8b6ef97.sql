
-- Add columns for install fee amount and static IP fee amount to carrier_quotes table
ALTER TABLE public.carrier_quotes 
ADD COLUMN install_fee_amount NUMERIC DEFAULT 0.00,
ADD COLUMN static_ip_fee_amount NUMERIC DEFAULT 0.00;
