
-- Drop existing policies on vendor_price_sheets table if they exist
DROP POLICY IF EXISTS "Users can view their own price sheets" ON public.vendor_price_sheets;
DROP POLICY IF EXISTS "Users can insert their own price sheets" ON public.vendor_price_sheets;
DROP POLICY IF EXISTS "Users can update their own price sheets" ON public.vendor_price_sheets;
DROP POLICY IF EXISTS "Users can delete their own price sheets" ON public.vendor_price_sheets;

-- Create new policies that allow admins to see all price sheets, users to see their own
CREATE POLICY "Users can view own price sheets, admins can view all" 
  ON public.vendor_price_sheets 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to insert their own price sheets
CREATE POLICY "Users can create their own price sheets" 
  ON public.vendor_price_sheets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own price sheets OR allows admins to update all price sheets
CREATE POLICY "Users can update own price sheets, admins can update all" 
  ON public.vendor_price_sheets 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to delete their own price sheets OR allows admins to delete all price sheets  
CREATE POLICY "Users can delete own price sheets, admins can delete all" 
  ON public.vendor_price_sheets 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
