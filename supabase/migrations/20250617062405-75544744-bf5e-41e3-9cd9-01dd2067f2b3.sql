
-- Add sales_model column and remove address/website columns from vendors table
ALTER TABLE public.vendors 
ADD COLUMN sales_model text,
ADD COLUMN rep_name text,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS contact_name;

-- Update existing vendors to have a default sales_model
UPDATE public.vendors 
SET sales_model = 'agent' 
WHERE sales_model IS NULL;
