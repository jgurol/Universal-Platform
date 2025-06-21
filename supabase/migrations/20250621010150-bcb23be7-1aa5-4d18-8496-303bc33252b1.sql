
-- Fix overly permissive RLS policies that allow unrestricted access

-- Drop the dangerous "true" policies for circuit_quotes
DROP POLICY IF EXISTS "Users can view all circuit quotes" ON public.circuit_quotes;

-- Create proper restrictive policy for circuit_quotes
CREATE POLICY "Users can view own circuit quotes, admins can view all" 
  ON public.circuit_quotes 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.get_current_user_role() = 'admin'
  );

-- Drop the dangerous "true" policies for carrier_quotes  
DROP POLICY IF EXISTS "Users can view all carrier quotes" ON public.carrier_quotes;

-- Create proper restrictive policy for carrier_quotes
CREATE POLICY "Users can view carrier quotes for own circuit quotes, admins can view all" 
  ON public.carrier_quotes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes 
      WHERE circuit_quotes.id = carrier_quotes.circuit_quote_id 
      AND circuit_quotes.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

-- Fix overly permissive client_addresses policies
DROP POLICY IF EXISTS "Users can view client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can create client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can update client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can delete client addresses" ON public.client_addresses;

-- Create proper restrictive policies for client_addresses
CREATE POLICY "Users can view own client addresses, admins can view all" 
  ON public.client_addresses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_addresses.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can create client addresses for own clients" 
  ON public.client_addresses 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_addresses.client_info_id 
      AND client_info.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own client addresses, admins can update all" 
  ON public.client_addresses 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_addresses.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own client addresses, admins can delete all" 
  ON public.client_addresses 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_addresses.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

-- Add missing RLS policies for tables that don't have proper protection
-- Enable RLS on client_contacts if not already enabled
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for client_contacts
CREATE POLICY "Users can view own client contacts, admins can view all" 
  ON public.client_contacts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can create client contacts for own clients" 
  ON public.client_contacts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own client contacts, admins can update all" 
  ON public.client_contacts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own client contacts, admins can delete all" 
  ON public.client_contacts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

-- Enable RLS on carrier_quote_notes and carrier_quote_note_files
ALTER TABLE public.carrier_quote_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_quote_note_files ENABLE ROW LEVEL SECURITY;

-- Create policies for carrier_quote_notes
CREATE POLICY "Users can view own carrier quote notes, admins can view all" 
  ON public.carrier_quote_notes 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can create their own carrier quote notes" 
  ON public.carrier_quote_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carrier quote notes, admins can update all" 
  ON public.carrier_quote_notes 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own carrier quote notes, admins can delete all" 
  ON public.carrier_quote_notes 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR public.get_current_user_role() = 'admin'
  );

-- Create policies for carrier_quote_note_files
CREATE POLICY "Users can view carrier quote note files for own notes, admins can view all" 
  ON public.carrier_quote_note_files 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes 
      WHERE carrier_quote_notes.id = carrier_quote_note_files.carrier_quote_note_id 
      AND carrier_quote_notes.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can create carrier quote note files for own notes" 
  ON public.carrier_quote_note_files 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes 
      WHERE carrier_quote_notes.id = carrier_quote_note_files.carrier_quote_note_id 
      AND carrier_quote_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update carrier quote note files for own notes, admins can update all" 
  ON public.carrier_quote_note_files 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes 
      WHERE carrier_quote_notes.id = carrier_quote_note_files.carrier_quote_note_id 
      AND carrier_quote_notes.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete carrier quote note files for own notes, admins can delete all" 
  ON public.carrier_quote_note_files 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes 
      WHERE carrier_quote_notes.id = carrier_quote_note_files.carrier_quote_note_id 
      AND carrier_quote_notes.user_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );
