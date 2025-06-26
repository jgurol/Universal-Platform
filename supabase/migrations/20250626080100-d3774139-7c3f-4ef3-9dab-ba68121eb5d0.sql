
-- Create storage bucket for carrier quote files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('carrier-quote-files', 'carrier-quote-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for carrier quote files
CREATE POLICY "Users can upload carrier quote files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'carrier-quote-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view carrier quote files" ON storage.objects
  FOR SELECT USING (bucket_id = 'carrier-quote-files');

CREATE POLICY "Users can update carrier quote files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'carrier-quote-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete carrier quote files" ON storage.objects
  FOR DELETE USING (bucket_id = 'carrier-quote-files' AND auth.role() = 'authenticated');
