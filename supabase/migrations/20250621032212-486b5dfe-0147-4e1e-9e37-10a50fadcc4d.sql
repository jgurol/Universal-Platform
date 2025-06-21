
-- BACKUP SQL - Current RLS Policies for Rollback
-- Run this script to restore your current policies if needed

-- ===== AGENTS TABLE =====
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;
DROP POLICY IF EXISTS "Users can view associated agents" ON public.agents;

CREATE POLICY "Admins can manage agents" ON public.agents FOR ALL USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))));
CREATE POLICY "Users can view associated agents" ON public.agents FOR SELECT USING ((auth.uid() = user_id) OR (id IN ( SELECT profiles.associated_agent_id FROM profiles WHERE (profiles.id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

-- ===== CARRIER_OPTIONS TABLE =====
DROP POLICY IF EXISTS "Users can create their own carrier options" ON public.carrier_options;
DROP POLICY IF EXISTS "Users can delete their own carrier options" ON public.carrier_options;
DROP POLICY IF EXISTS "Users can update their own carrier options" ON public.carrier_options;
DROP POLICY IF EXISTS "Users can view their own carrier options" ON public.carrier_options;

CREATE POLICY "Users can create their own carrier options" ON public.carrier_options FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own carrier options" ON public.carrier_options FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own carrier options" ON public.carrier_options FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own carrier options" ON public.carrier_options FOR SELECT USING (auth.uid() = user_id);

-- ===== CARRIER_QUOTE_NOTE_FILES TABLE =====
DROP POLICY IF EXISTS "Users can create files for their notes" ON public.carrier_quote_note_files;
DROP POLICY IF EXISTS "Users can delete files from their notes" ON public.carrier_quote_note_files;
DROP POLICY IF EXISTS "Users can view files for their notes" ON public.carrier_quote_note_files;

CREATE POLICY "Users can create files for their notes" ON public.carrier_quote_note_files FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM ((carrier_quote_notes n JOIN carrier_quotes cq ON ((n.carrier_quote_id = cq.id))) JOIN circuit_quotes q ON ((cq.circuit_quote_id = q.id))) WHERE ((n.id = carrier_quote_note_files.carrier_quote_note_id) AND (q.user_id = auth.uid()))));
CREATE POLICY "Users can delete files from their notes" ON public.carrier_quote_note_files FOR DELETE USING (EXISTS ( SELECT 1 FROM ((carrier_quote_notes n JOIN carrier_quotes cq ON ((n.carrier_quote_id = cq.id))) JOIN circuit_quotes q ON ((cq.circuit_quote_id = q.id))) WHERE ((n.id = carrier_quote_note_files.carrier_quote_note_id) AND (q.user_id = auth.uid()))));
CREATE POLICY "Users can view files for their notes" ON public.carrier_quote_note_files FOR SELECT USING (EXISTS ( SELECT 1 FROM ((carrier_quote_notes n JOIN carrier_quotes cq ON ((n.carrier_quote_id = cq.id))) JOIN circuit_quotes q ON ((cq.circuit_quote_id = q.id))) WHERE ((n.id = carrier_quote_note_files.carrier_quote_note_id) AND (q.user_id = auth.uid()))));

-- ===== CARRIER_QUOTE_NOTES TABLE =====
DROP POLICY IF EXISTS "Users can create notes for their carrier quotes" ON public.carrier_quote_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.carrier_quote_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.carrier_quote_notes;
DROP POLICY IF EXISTS "Users can view notes for their carrier quotes" ON public.carrier_quote_notes;

CREATE POLICY "Users can create notes for their carrier quotes" ON public.carrier_quote_notes FOR INSERT WITH CHECK ((auth.uid() = user_id) AND (EXISTS ( SELECT 1 FROM (carrier_quotes cq JOIN circuit_quotes q ON ((cq.circuit_quote_id = q.id))) WHERE ((cq.id = carrier_quote_notes.carrier_quote_id) AND (q.user_id = auth.uid())))));
CREATE POLICY "Users can delete their own notes" ON public.carrier_quote_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.carrier_quote_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view notes for their carrier quotes" ON public.carrier_quote_notes FOR SELECT USING (EXISTS ( SELECT 1 FROM (carrier_quotes cq JOIN circuit_quotes q ON ((cq.circuit_quote_id = q.id))) WHERE ((cq.id = carrier_quote_notes.carrier_quote_id) AND (q.user_id = auth.uid()))));

-- ===== CARRIER_QUOTES TABLE (CRITICAL - CURRENTLY ALLOWS ALL ACCESS) =====
DROP POLICY IF EXISTS "Admins can delete any carrier quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Admins can insert any carrier quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Admins can update any carrier quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can create carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can delete carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can insert carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can update carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can view all carrier quotes" ON public.carrier_quotes;

CREATE POLICY "Admins can delete any carrier quotes" ON public.carrier_quotes FOR DELETE USING (get_current_user_role() = 'admin'::text);
CREATE POLICY "Admins can insert any carrier quotes" ON public.carrier_quotes FOR INSERT WITH CHECK (get_current_user_role() = 'admin'::text);
CREATE POLICY "Admins can update any carrier quotes" ON public.carrier_quotes FOR UPDATE USING (get_current_user_role() = 'admin'::text);
CREATE POLICY "Users can create carrier quotes for their circuit quotes" ON public.carrier_quotes FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM circuit_quotes cq WHERE ((cq.id = carrier_quotes.circuit_quote_id) AND (cq.user_id = auth.uid()))));
CREATE POLICY "Users can delete carrier quotes for their circuit quotes" ON public.carrier_quotes FOR DELETE USING (EXISTS ( SELECT 1 FROM circuit_quotes cq WHERE ((cq.id = carrier_quotes.circuit_quote_id) AND (cq.user_id = auth.uid()))));
CREATE POLICY "Users can insert carrier quotes for their circuit quotes" ON public.carrier_quotes FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM circuit_quotes WHERE ((circuit_quotes.id = carrier_quotes.circuit_quote_id) AND (circuit_quotes.user_id = auth.uid()))));
CREATE POLICY "Users can update carrier quotes for their circuit quotes" ON public.carrier_quotes FOR UPDATE USING (EXISTS ( SELECT 1 FROM circuit_quotes cq WHERE ((cq.id = carrier_quotes.circuit_quote_id) AND (cq.user_id = auth.uid()))));
CREATE POLICY "Users can view all carrier quotes" ON public.carrier_quotes FOR SELECT USING (true);

-- ===== CIRCUIT_QUOTES TABLE (CRITICAL - CURRENTLY ALLOWS ALL ACCESS) =====
DROP POLICY IF EXISTS "Admins can delete any circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Admins can insert any circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Admins can update any circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can create their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can delete their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can insert their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can update their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can view all circuit quotes" ON public.circuit_quotes;

CREATE POLICY "Admins can delete any circuit quotes" ON public.circuit_quotes FOR DELETE USING (get_current_user_role() = 'admin'::text);
CREATE POLICY "Admins can insert any circuit quotes" ON public.circuit_quotes FOR INSERT WITH CHECK (get_current_user_role() = 'admin'::text);
CREATE POLICY "Admins can update any circuit quotes" ON public.circuit_quotes FOR UPDATE USING (get_current_user_role() = 'admin'::text);
CREATE POLICY "Users can create their own circuit quotes" ON public.circuit_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own circuit quotes" ON public.circuit_quotes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own circuit quotes" ON public.circuit_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own circuit quotes" ON public.circuit_quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view all circuit quotes" ON public.circuit_quotes FOR SELECT USING (true);

-- ===== CLIENT_ADDRESSES TABLE (CRITICAL - HAS DANGEROUS POLICIES) =====
DROP POLICY IF EXISTS "Allow public read access to client_addresses for quote acceptan" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can create addresses for their clients" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can create client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can delete addresses for their clients" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can delete client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can update addresses for their clients" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can update client addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can view addresses for their clients" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can view client addresses" ON public.client_addresses;

CREATE POLICY "Allow public read access to client_addresses for quote acceptan" ON public.client_addresses FOR SELECT TO anon USING (true);
CREATE POLICY "Users can create addresses for their clients" ON public.client_addresses FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM client_info ci WHERE ((ci.id = client_addresses.client_info_id) AND (ci.user_id = auth.uid()))));
CREATE POLICY "Users can create client addresses" ON public.client_addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete addresses for their clients" ON public.client_addresses FOR DELETE USING (EXISTS ( SELECT 1 FROM client_info ci WHERE ((ci.id = client_addresses.client_info_id) AND (ci.user_id = auth.uid()))));
CREATE POLICY "Users can delete client addresses" ON public.client_addresses FOR DELETE USING (true);
CREATE POLICY "Users can update addresses for their clients" ON public.client_addresses FOR UPDATE USING (EXISTS ( SELECT 1 FROM client_info ci WHERE ((ci.id = client_addresses.client_info_id) AND (ci.user_id = auth.uid()))));
CREATE POLICY "Users can update client addresses" ON public.client_addresses FOR UPDATE USING (true);
CREATE POLICY "Users can view addresses for their clients" ON public.client_addresses FOR SELECT USING (EXISTS ( SELECT 1 FROM client_info ci WHERE ((ci.id = client_addresses.client_info_id) AND (ci.user_id = auth.uid()))));
CREATE POLICY "Users can view client addresses" ON public.client_addresses FOR SELECT USING (true);

-- ===== CLIENT_CONTACTS TABLE =====
DROP POLICY IF EXISTS "Users can create contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can view contacts for their clients" ON public.client_contacts;

CREATE POLICY "Users can create contacts for their clients" ON public.client_contacts FOR INSERT WITH CHECK (EXISTS ( SELECT 1 FROM client_info WHERE ((client_info.id = client_contacts.client_info_id) AND (client_info.user_id = auth.uid()))));
CREATE POLICY "Users can delete contacts for their clients" ON public.client_contacts FOR DELETE USING (EXISTS ( SELECT 1 FROM client_info WHERE ((client_info.id = client_contacts.client_info_id) AND (client_info.user_id = auth.uid()))));
CREATE POLICY "Users can update contacts for their clients" ON public.client_contacts FOR UPDATE USING (EXISTS ( SELECT 1 FROM client_info WHERE ((client_info.id = client_contacts.client_info_id) AND (client_info.user_id = auth.uid()))));
CREATE POLICY "Users can view contacts for their clients" ON public.client_contacts FOR SELECT USING (EXISTS ( SELECT 1 FROM client_info WHERE ((client_info.id = client_contacts.client_info_id) AND (client_info.user_id = auth.uid()))));
