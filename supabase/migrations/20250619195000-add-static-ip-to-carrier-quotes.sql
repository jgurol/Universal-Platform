
-- Add static_ip column to carrier_quotes table if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'carrier_quotes' 
        AND column_name = 'static_ip'
    ) THEN
        ALTER TABLE public.carrier_quotes ADD COLUMN static_ip boolean DEFAULT false;
    END IF;
END $$;
