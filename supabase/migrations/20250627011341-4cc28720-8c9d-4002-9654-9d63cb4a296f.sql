
-- Create a login_logs table to track user login timestamps
CREATE TABLE public.login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  login_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX idx_login_logs_login_at ON public.login_logs(login_at);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for login_logs
CREATE POLICY "Users can view their own login logs" 
  ON public.login_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login logs" 
  ON public.login_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "System can insert login logs" 
  ON public.login_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Add a function to get the last login for a user
CREATE OR REPLACE FUNCTION public.get_user_last_login(user_uuid uuid)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT login_at 
  FROM public.login_logs 
  WHERE user_id = user_uuid 
  ORDER BY login_at DESC 
  LIMIT 1;
$$;
