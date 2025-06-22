
-- Add is_public column to vendor_price_sheets table
ALTER TABLE public.vendor_price_sheets 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Update RLS policies to include the new column
CREATE POLICY "Admins can view all price sheets including public ones"
ON public.vendor_price_sheets FOR SELECT
USING (
  auth.uid() = user_id OR 
  (is_public = true AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ))
);
