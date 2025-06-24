
-- Remove the acceptance_status column from quotes table since it's redundant with the main status field
ALTER TABLE public.quotes DROP COLUMN IF EXISTS acceptance_status;
