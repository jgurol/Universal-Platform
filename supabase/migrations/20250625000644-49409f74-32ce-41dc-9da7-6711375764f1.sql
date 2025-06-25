
-- Add columns for 5 Static IP (/29) support to carrier_quotes table
ALTER TABLE carrier_quotes 
ADD COLUMN static_ip_5 boolean DEFAULT false,
ADD COLUMN static_ip_5_fee_amount numeric DEFAULT 0.00;
