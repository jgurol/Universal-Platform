
-- Create table for carrier options
CREATE TABLE public.carrier_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for circuit type options
CREATE TABLE public.circuit_type_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for carrier_options
ALTER TABLE public.carrier_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own carrier options" 
  ON public.carrier_options 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own carrier options" 
  ON public.carrier_options 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own carrier options" 
  ON public.carrier_options 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carrier options" 
  ON public.carrier_options 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add Row Level Security (RLS) for circuit_type_options
ALTER TABLE public.circuit_type_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own circuit type options" 
  ON public.circuit_type_options 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own circuit type options" 
  ON public.circuit_type_options 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own circuit type options" 
  ON public.circuit_type_options 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circuit type options" 
  ON public.circuit_type_options 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert some default carrier options (you can modify these as needed)
INSERT INTO public.carrier_options (user_id, name) VALUES 
  ((SELECT id FROM auth.users LIMIT 1), 'Verizon'),
  ((SELECT id FROM auth.users LIMIT 1), 'AT&T'),
  ((SELECT id FROM auth.users LIMIT 1), 'Comcast'),
  ((SELECT id FROM auth.users LIMIT 1), 'Spectrum'),
  ((SELECT id FROM auth.users LIMIT 1), 'CenturyLink'),
  ((SELECT id FROM auth.users LIMIT 1), 'Frontier');

-- Insert some default circuit type options (you can modify these as needed)
INSERT INTO public.circuit_type_options (user_id, name) VALUES 
  ((SELECT id FROM auth.users LIMIT 1), 'Fiber'),
  ((SELECT id FROM auth.users LIMIT 1), 'Copper'),
  ((SELECT id FROM auth.users LIMIT 1), 'Ethernet'),
  ((SELECT id FROM auth.users LIMIT 1), 'MPLS'),
  ((SELECT id FROM auth.users LIMIT 1), 'Wireless'),
  ((SELECT id FROM auth.users LIMIT 1), 'Cable');
