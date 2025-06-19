
-- First, drop any existing policies on vendors table
DROP POLICY IF EXISTS "Users can view their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can create their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete their own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;

-- Enable RLS (this is idempotent, so safe to run even if already enabled)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own vendors OR allows admins to view all vendors
CREATE POLICY "Users can view own vendors, admins can view all" 
  ON public.vendors 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to create their own vendors
CREATE POLICY "Users can create their own vendors" 
  ON public.vendors 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own vendors OR allows admins to update all vendors
CREATE POLICY "Users can update own vendors, admins can update all" 
  ON public.vendors 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to delete their own vendors OR allows admins to delete all vendors
CREATE POLICY "Users can delete own vendors, admins can delete all" 
  ON public.vendors 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
