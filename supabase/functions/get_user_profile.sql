
-- Creates a secure function to get a user's profile without RLS conflicts
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  is_associated boolean,
  associated_agent_id uuid,
  timezone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.is_associated,
    p.associated_agent_id,
    p.timezone
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;
