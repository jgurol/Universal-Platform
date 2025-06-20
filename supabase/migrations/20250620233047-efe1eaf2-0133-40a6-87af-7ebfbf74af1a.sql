
-- Enable RLS on categories table if not already enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active categories
CREATE POLICY "All users can view active categories" 
  ON public.categories 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- Only allow admins to insert categories
CREATE POLICY "Only admins can insert categories" 
  ON public.categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only allow admins to update categories
CREATE POLICY "Only admins can update categories" 
  ON public.categories 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only allow admins to delete categories (soft delete by setting is_active = false)
CREATE POLICY "Only admins can delete categories" 
  ON public.categories 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
