
-- Create apps table to store all available applications
CREATE TABLE public.apps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  route text NOT NULL,
  icon_name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_app_access table to manage which users can access which apps
CREATE TABLE public.user_app_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, app_id)
);

-- Enable RLS on both tables
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for apps table (readable by all authenticated users)
CREATE POLICY "Apps are viewable by authenticated users" 
  ON public.apps 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- RLS policies for user_app_access table
CREATE POLICY "Users can view their own app access" 
  ON public.user_app_access 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all app access" 
  ON public.user_app_access 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert the initial apps
INSERT INTO public.apps (name, description, route, icon_name, color, display_order) VALUES
  ('Client Management', 'Manage your clients and their information', '/client-management', 'Users', '#4F46E5', 1),
  ('Deal Registration', 'Register and track your sales opportunities', '/deal-registration', 'Target', '#059669', 2),
  ('Circuit Quotes', 'Research and compare carrier pricing before quoting', '/circuit-quotes', 'Search', '#7C3AED', 3),
  ('Quoting System', 'Create and manage quotes for clients', '/quoting-system', 'FileText', '#2563EB', 4),
  ('Circuit Progress Tracking', 'Monitor circuit installation and progress', '/circuit-tracking', 'Zap', '#EA580C', 5),
  ('Track Commissions', 'Track your client payments & commissions', '/billing', 'DollarSign', '#059669', 6);
