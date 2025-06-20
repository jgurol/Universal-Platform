
-- Drop all existing policies on profiles table to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create new policies with unique names
CREATE POLICY "authenticated_users_can_view_profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "users_can_insert_own_profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);
