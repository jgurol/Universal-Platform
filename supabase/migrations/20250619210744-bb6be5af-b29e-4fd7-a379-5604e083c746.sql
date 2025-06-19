
-- First, let's check what RLS policies currently exist for circuit_quotes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('circuit_quotes', 'carrier_quotes');

-- Add admin access policies for circuit_quotes if they don't exist
DO $$
BEGIN
    -- Check if admin policy exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_quotes' 
        AND policyname = 'Admins can view all circuit quotes'
    ) THEN
        -- Create policy for admins to view all circuit quotes
        EXECUTE 'CREATE POLICY "Admins can view all circuit quotes" 
                 ON public.circuit_quotes 
                 FOR SELECT 
                 USING (public.get_current_user_role() = ''admin'')';
    END IF;

    -- Check if admin policy exists for carrier_quotes, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'carrier_quotes' 
        AND policyname = 'Admins can view all carrier quotes'
    ) THEN
        -- Create policy for admins to view all carrier quotes
        EXECUTE 'CREATE POLICY "Admins can view all carrier quotes" 
                 ON public.carrier_quotes 
                 FOR SELECT 
                 USING (public.get_current_user_role() = ''admin'')';
    END IF;
END $$;
