
-- Create storage bucket for agent documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-documents', 'agent-documents', false);

-- Create policies for agent documents bucket
CREATE POLICY "Allow public upload to agent-documents bucket" 
  ON storage.objects 
  FOR INSERT 
  TO anon
  WITH CHECK (bucket_id = 'agent-documents');

CREATE POLICY "Allow authenticated users to view agent documents" 
  ON storage.objects 
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'agent-documents');

CREATE POLICY "Allow authenticated users to manage agent documents" 
  ON storage.objects 
  FOR ALL 
  TO authenticated
  USING (bucket_id = 'agent-documents');
