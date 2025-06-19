
-- Enable Row Level Security on both tables (safe to run multiple times)
ALTER TABLE public.circuit_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_quotes ENABLE ROW LEVEL SECURITY;

-- Safely create policies only if they don't exist
DO $$
BEGIN
    -- Circuit quotes policies for regular users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Users can view their own circuit quotes') THEN
        CREATE POLICY "Users can view their own circuit quotes" 
        ON public.circuit_quotes 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Users can insert their own circuit quotes') THEN
        CREATE POLICY "Users can insert their own circuit quotes" 
        ON public.circuit_quotes 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Users can update their own circuit quotes') THEN
        CREATE POLICY "Users can update their own circuit quotes" 
        ON public.circuit_quotes 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Users can delete their own circuit quotes') THEN
        CREATE POLICY "Users can delete their own circuit quotes" 
        ON public.circuit_quotes 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;

    -- Carrier quotes policies for regular users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Users can view carrier quotes for their circuit quotes') THEN
        CREATE POLICY "Users can view carrier quotes for their circuit quotes" 
        ON public.carrier_quotes 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.circuit_quotes 
            WHERE circuit_quotes.id = carrier_quotes.circuit_quote_id 
            AND circuit_quotes.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Users can insert carrier quotes for their circuit quotes') THEN
        CREATE POLICY "Users can insert carrier quotes for their circuit quotes" 
        ON public.carrier_quotes 
        FOR INSERT 
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.circuit_quotes 
            WHERE circuit_quotes.id = carrier_quotes.circuit_quote_id 
            AND circuit_quotes.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Users can update carrier quotes for their circuit quotes') THEN
        CREATE POLICY "Users can update carrier quotes for their circuit quotes" 
        ON public.carrier_quotes 
        FOR UPDATE 
        USING (
          EXISTS (
            SELECT 1 FROM public.circuit_quotes 
            WHERE circuit_quotes.id = carrier_quotes.circuit_quote_id 
            AND circuit_quotes.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Users can delete carrier quotes for their circuit quotes') THEN
        CREATE POLICY "Users can delete carrier quotes for their circuit quotes" 
        ON public.carrier_quotes 
        FOR DELETE 
        USING (
          EXISTS (
            SELECT 1 FROM public.circuit_quotes 
            WHERE circuit_quotes.id = carrier_quotes.circuit_quote_id 
            AND circuit_quotes.user_id = auth.uid()
          )
        );
    END IF;

    -- Admin policies for circuit_quotes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Admins can insert any circuit quotes') THEN
        CREATE POLICY "Admins can insert any circuit quotes" 
        ON public.circuit_quotes 
        FOR INSERT 
        WITH CHECK (public.get_current_user_role() = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Admins can update any circuit quotes') THEN
        CREATE POLICY "Admins can update any circuit quotes" 
        ON public.circuit_quotes 
        FOR UPDATE 
        USING (public.get_current_user_role() = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'circuit_quotes' AND policyname = 'Admins can delete any circuit quotes') THEN
        CREATE POLICY "Admins can delete any circuit quotes" 
        ON public.circuit_quotes 
        FOR DELETE 
        USING (public.get_current_user_role() = 'admin');
    END IF;

    -- Admin policies for carrier_quotes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Admins can insert any carrier quotes') THEN
        CREATE POLICY "Admins can insert any carrier quotes" 
        ON public.carrier_quotes 
        FOR INSERT 
        WITH CHECK (public.get_current_user_role() = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Admins can update any carrier quotes') THEN
        CREATE POLICY "Admins can update any carrier quotes" 
        ON public.carrier_quotes 
        FOR UPDATE 
        USING (public.get_current_user_role() = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_quotes' AND policyname = 'Admins can delete any carrier quotes') THEN
        CREATE POLICY "Admins can delete any carrier quotes" 
        ON public.carrier_quotes 
        FOR DELETE 
        USING (public.get_current_user_role() = 'admin');
    END IF;
END $$;
