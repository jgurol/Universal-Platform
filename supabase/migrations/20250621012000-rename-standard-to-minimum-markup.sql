
-- Rename standard_markup to minimum_markup in categories table
ALTER TABLE public.categories 
RENAME COLUMN standard_markup TO minimum_markup;

-- Update the comment to reflect the new purpose
COMMENT ON COLUMN public.categories.minimum_markup IS 'Minimum markup percentage required for quoting customers - can be overridden per quote item';
