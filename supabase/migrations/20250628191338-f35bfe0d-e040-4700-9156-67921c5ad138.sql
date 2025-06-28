
-- Add credit check fields to client_info table
ALTER TABLE public.client_info 
ADD COLUMN credit_score INTEGER,
ADD COLUMN credit_rating TEXT,
ADD COLUMN credit_risk_level TEXT,
ADD COLUMN credit_recommendation TEXT,
ADD COLUMN credit_check_date TIMESTAMP WITH TIME ZONE;
