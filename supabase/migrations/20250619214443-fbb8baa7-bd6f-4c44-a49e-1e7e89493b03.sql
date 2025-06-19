
-- Drop existing policies on speeds table
DROP POLICY IF EXISTS "Users can view speeds" ON public.speeds;
DROP POLICY IF EXISTS "Users can create their own speeds" ON public.speeds;
DROP POLICY IF EXISTS "Users can update their own speeds" ON public.speeds;
DROP POLICY IF EXISTS "Users can delete their own speeds" ON public.speeds;

-- Create new policies that allow admins to see all speeds, users to see system defaults and their own
CREATE POLICY "Users can view speeds, admins can view all" 
  ON public.speeds 
  FOR SELECT 
  USING (
    user_id = '00000000-0000-0000-0000-000000000000' 
    OR auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to insert their own speeds
CREATE POLICY "Users can create their own speeds" 
  ON public.speeds 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own speeds OR allows admins to update all speeds
CREATE POLICY "Users can update own speeds, admins can update all" 
  ON public.speeds 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy that allows users to delete their own speeds OR allows admins to delete all speeds  
CREATE POLICY "Users can delete own speeds, admins can delete all" 
  ON public.speeds 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
