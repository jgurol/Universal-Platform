
-- Add image columns to quote_items table
ALTER TABLE public.quote_items 
ADD COLUMN image_url text,
ADD COLUMN image_name text;

-- Create a storage bucket for quote item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-item-images', 'quote-item-images', true);

-- Create storage policy to allow authenticated users to upload images
CREATE POLICY "Users can upload quote item images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quote-item-images' AND
  auth.role() = 'authenticated'
);

-- Create storage policy to allow viewing images
CREATE POLICY "Anyone can view quote item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-item-images');

-- Create storage policy to allow users to update their own images
CREATE POLICY "Users can update quote item images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'quote-item-images' AND
  auth.role() = 'authenticated'
);

-- Create storage policy to allow users to delete their own images
CREATE POLICY "Users can delete quote item images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'quote-item-images' AND
  auth.role() = 'authenticated'
);
