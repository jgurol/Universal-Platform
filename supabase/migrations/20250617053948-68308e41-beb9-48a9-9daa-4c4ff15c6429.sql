
-- Create circuit_quotes table
CREATE TABLE public.circuit_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  client_info_id uuid REFERENCES public.client_info(id),
  client_name text NOT NULL,
  location text NOT NULL,
  suite text,
  status text NOT NULL DEFAULT 'researching',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create carrier_quotes table
CREATE TABLE public.carrier_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circuit_quote_id uuid REFERENCES public.circuit_quotes(id) ON DELETE CASCADE NOT NULL,
  carrier text NOT NULL,
  type text NOT NULL,
  speed text NOT NULL,
  price numeric NOT NULL,
  term text,
  notes text,
  color text NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.circuit_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_quotes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for circuit_quotes
CREATE POLICY "Users can view their own circuit quotes" 
  ON public.circuit_quotes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own circuit quotes" 
  ON public.circuit_quotes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own circuit quotes" 
  ON public.circuit_quotes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circuit quotes" 
  ON public.circuit_quotes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for carrier_quotes
CREATE POLICY "Users can view carrier quotes for their circuit quotes" 
  ON public.carrier_quotes 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.circuit_quotes cq 
    WHERE cq.id = carrier_quotes.circuit_quote_id 
    AND cq.user_id = auth.uid()
  ));

CREATE POLICY "Users can create carrier quotes for their circuit quotes" 
  ON public.carrier_quotes 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.circuit_quotes cq 
    WHERE cq.id = carrier_quotes.circuit_quote_id 
    AND cq.user_id = auth.uid()
  ));

CREATE POLICY "Users can update carrier quotes for their circuit quotes" 
  ON public.carrier_quotes 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.circuit_quotes cq 
    WHERE cq.id = carrier_quotes.circuit_quote_id 
    AND cq.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete carrier quotes for their circuit quotes" 
  ON public.carrier_quotes 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.circuit_quotes cq 
    WHERE cq.id = carrier_quotes.circuit_quote_id 
    AND cq.user_id = auth.uid()
  ));
