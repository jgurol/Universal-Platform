
-- Drop all existing policies on categories table (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view own categories, admins can view all" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories, admins can update all" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories, admins can delete all" ON public.categories;

-- Create new policies that allow admins to see all categories, users to see their own
CREATE POLICY "Users can view own categories, admins can view all" 
  ON public.categories 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to insert their own categories
CREATE POLICY "Users can create their own categories" 
  ON public.categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own categories OR allows admins to update all categories
CREATE POLICY "Users can update own categories, admins can update all" 
  ON public.categories 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to delete their own categories OR allows admins to delete all categories  
CREATE POLICY "Users can delete own categories, admins can delete all" 
  ON public.categories 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
