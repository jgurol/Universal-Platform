
-- First, let's see what the current constraint allows and update it
-- Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new constraint that allows both 'admin' and 'agent' roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'agent', 'user'));
