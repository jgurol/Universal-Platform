
-- Add checkbox fields to carrier_quotes table
ALTER TABLE public.carrier_quotes 
ADD COLUMN static_ip boolean DEFAULT false,
ADD COLUMN slash_29 boolean DEFAULT false,
ADD COLUMN install_fee boolean DEFAULT false,
ADD COLUMN site_survey_needed boolean DEFAULT false;
