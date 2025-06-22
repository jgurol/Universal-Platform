
-- Remove redundant contact fields from client_info table since we now have client_contacts table
ALTER TABLE public.client_info 
DROP COLUMN IF EXISTS contact_name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS address;
