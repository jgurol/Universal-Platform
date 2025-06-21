
-- Add a table to store circuit quote categories
CREATE TABLE public.circuit_quote_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circuit_quote_id UUID NOT NULL REFERENCES public.circuit_quotes(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for circuit quote categories
ALTER TABLE public.circuit_quote_categories ENABLE ROW LEVEL SECURITY;

-- Allow users to view categories for quotes they can access
CREATE POLICY "Users can view circuit quote categories they have access to" 
  ON public.circuit_quote_categories 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = circuit_quote_id 
      AND (cq.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Allow users to insert categories for their own quotes
CREATE POLICY "Users can create categories for their own circuit quotes" 
  ON public.circuit_quote_categories 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = circuit_quote_id 
      AND (cq.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Allow users to update categories for quotes they can access
CREATE POLICY "Users can update categories for circuit quotes they have access to" 
  ON public.circuit_quote_categories 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = circuit_quote_id 
      AND (cq.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Allow users to delete categories for quotes they can access
CREATE POLICY "Users can delete categories for circuit quotes they have access to" 
  ON public.circuit_quote_categories 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = circuit_quote_id 
      AND (cq.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );
