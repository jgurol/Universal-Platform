
-- Add a default_selected column to the categories table
ALTER TABLE public.categories 
ADD COLUMN default_selected boolean NOT NULL DEFAULT false;
