
-- Add deal_registration_id column to circuit_quotes table
ALTER TABLE public.circuit_quotes 
ADD COLUMN deal_registration_id uuid REFERENCES public.deal_registrations(id);

-- Add an index for better query performance
CREATE INDEX idx_circuit_quotes_deal_registration_id ON public.circuit_quotes(deal_registration_id);
