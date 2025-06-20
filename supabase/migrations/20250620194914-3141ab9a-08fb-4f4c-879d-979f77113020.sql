
-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view all profiles
-- This is needed for the user dropdown in client management
CREATE POLICY "Users can view all profiles for client association" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for users to view and update their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for user creation (typically handled by triggers)
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);
