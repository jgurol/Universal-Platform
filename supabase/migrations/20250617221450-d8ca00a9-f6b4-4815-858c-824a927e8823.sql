
-- Drop the existing RLS policies for speeds
DROP POLICY IF EXISTS "Users can view their own speeds" ON public.speeds;
DROP POLICY IF EXISTS "Users can create their own speeds" ON public.speeds;
DROP POLICY IF EXISTS "Users can update their own speeds" ON public.speeds;
DROP POLICY IF EXISTS "Users can delete their own speeds" ON public.speeds;

-- Create new policies that allow viewing system defaults and own speeds
CREATE POLICY "Users can view speeds" 
  ON public.speeds 
  FOR SELECT 
  USING (
    user_id = '00000000-0000-0000-0000-000000000000' OR 
    auth.uid() = user_id
  );

-- Create policy that allows users to insert their own speeds
CREATE POLICY "Users can create their own speeds" 
  ON public.speeds 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own speeds (not system defaults)
CREATE POLICY "Users can update their own speeds" 
  ON public.speeds 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own speeds (not system defaults)
CREATE POLICY "Users can delete their own speeds" 
  ON public.speeds 
  FOR DELETE 
  USING (auth.uid() = user_id);
