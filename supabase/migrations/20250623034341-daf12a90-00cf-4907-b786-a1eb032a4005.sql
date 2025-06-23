
-- Check if there are any quotes at all
SELECT COUNT(*) as quote_count FROM quotes;

-- If there are quotes, show them all
SELECT id, quote_number, description, user_id, created_at FROM quotes;

-- Also check what's in the profiles table
SELECT id, full_name, email, role FROM profiles;
