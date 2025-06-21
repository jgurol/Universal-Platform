
-- Add Row Level Security policies for deal_registrations table
ALTER TABLE public.deal_registrations ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all deals
CREATE POLICY "Admins can view all deals" 
  ON public.deal_registrations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy for users to view their own deals
CREATE POLICY "Users can view their own deals" 
  ON public.deal_registrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for admins to insert deals
CREATE POLICY "Admins can create deals" 
  ON public.deal_registrations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy for users to insert their own deals
CREATE POLICY "Users can create their own deals" 
  ON public.deal_registrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to update all deals
CREATE POLICY "Admins can update all deals" 
  ON public.deal_registrations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy for users to update their own deals
CREATE POLICY "Users can update their own deals" 
  ON public.deal_registrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for admins to delete all deals
CREATE POLICY "Admins can delete all deals" 
  ON public.deal_registrations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy for users to delete their own deals
CREATE POLICY "Users can delete their own deals" 
  ON public.deal_registrations 
  FOR DELETE 
  USING (auth.uid() = user_id);
