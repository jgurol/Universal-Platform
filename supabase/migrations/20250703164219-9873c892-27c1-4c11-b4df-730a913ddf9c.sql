-- Add admin-only notification preference for deal creation
ALTER TABLE public.notification_preferences 
ADD COLUMN deal_created_admin BOOLEAN NOT NULL DEFAULT true;