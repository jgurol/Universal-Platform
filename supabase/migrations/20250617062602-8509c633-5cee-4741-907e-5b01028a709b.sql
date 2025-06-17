
-- Add color column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN color text DEFAULT '#3B82F6';

-- Update existing vendors with default color
UPDATE public.vendors 
SET color = '#3B82F6' 
WHERE color IS NULL;
