
-- Add standard_markup column to categories table
ALTER TABLE public.categories 
ADD COLUMN standard_markup numeric DEFAULT 0.00;

-- Add a comment to document the column
COMMENT ON COLUMN public.categories.standard_markup IS 'Default markup percentage for quoting customers';
