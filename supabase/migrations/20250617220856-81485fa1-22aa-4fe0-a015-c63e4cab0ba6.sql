
-- Create a table for speed options
CREATE TABLE public.speeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.speeds ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own speeds
CREATE POLICY "Users can view their own speeds" 
  ON public.speeds 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own speeds
CREATE POLICY "Users can create their own speeds" 
  ON public.speeds 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own speeds
CREATE POLICY "Users can update their own speeds" 
  ON public.speeds 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own speeds
CREATE POLICY "Users can delete their own speeds" 
  ON public.speeds 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert some common speed options
INSERT INTO public.speeds (user_id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000000', '10x10M', '10 Mbps upload/download'),
  ('00000000-0000-0000-0000-000000000000', '25x25M', '25 Mbps upload/download'),
  ('00000000-0000-0000-0000-000000000000', '50x50M', '50 Mbps upload/download'),
  ('00000000-0000-0000-0000-000000000000', '100x100M', '100 Mbps upload/download'),
  ('00000000-0000-0000-0000-000000000000', '500x500M', '500 Mbps upload/download'),
  ('00000000-0000-0000-0000-000000000000', '1Gx1G', '1 Gbps upload/download'),
  ('00000000-0000-0000-0000-000000000000', '10Gx10G', '10 Gbps upload/download');
