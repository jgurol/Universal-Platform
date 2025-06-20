
-- First, let's see what RLS policies currently exist on the profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop any existing conflicting policies to start fresh
DROP POLICY IF EXISTS "authenticated_users_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a simple policy that allows authenticated users to view all profiles
-- This is needed for the user dropdown in client management
CREATE POLICY "profiles_select_authenticated" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "profiles_insert_own" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);
