
-- Add archived column to deal_registrations table
ALTER TABLE public.deal_registrations 
ADD COLUMN archived BOOLEAN DEFAULT false;

-- Add index for better performance when filtering archived deals
CREATE INDEX idx_deal_registrations_archived ON public.deal_registrations(archived);
