
-- Make the carrier-quote-files bucket public so images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'carrier-quote-files';
