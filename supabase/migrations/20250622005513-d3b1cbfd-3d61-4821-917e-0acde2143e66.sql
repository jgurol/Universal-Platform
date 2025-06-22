
-- First, let's check and fix the RLS policies for vendor_price_sheets
-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all price sheets including public ones" ON public.vendor_price_sheets;

-- Create policies that allow proper access to price sheets
-- Policy 1: Users can see their own price sheets
CREATE POLICY "Users can view their own price sheets" 
ON public.vendor_price_sheets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Anyone can see public price sheets
CREATE POLICY "Anyone can view public price sheets" 
ON public.vendor_price_sheets 
FOR SELECT 
USING (is_public = true);

-- Policy 3: Users can insert their own price sheets
CREATE POLICY "Users can insert their own price sheets" 
ON public.vendor_price_sheets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own price sheets
CREATE POLICY "Users can update their own price sheets" 
ON public.vendor_price_sheets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy 5: Users can delete their own price sheets
CREATE POLICY "Users can delete their own price sheets" 
ON public.vendor_price_sheets 
FOR DELETE 
USING (auth.uid() = user_id);
