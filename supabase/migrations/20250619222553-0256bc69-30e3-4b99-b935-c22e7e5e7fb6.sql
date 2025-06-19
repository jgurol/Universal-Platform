
-- Enable Row Level Security on circuit_tracking table (safe to run multiple times)
ALTER TABLE public.circuit_tracking ENABLE ROW LEVEL SECURITY;

-- Create admin policy for circuit_tracking to allow admins to view all records
DO $$
BEGIN
    -- Check if admin policy exists for circuit_tracking, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_tracking' 
        AND policyname = 'Admins can view all circuit tracking'
    ) THEN
        CREATE POLICY "Admins can view all circuit tracking" 
        ON public.circuit_tracking 
        FOR SELECT 
        USING (public.get_current_user_role() = 'admin');
    END IF;

    -- Check if admin policy exists for circuit_milestones, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_milestones' 
        AND policyname = 'Admins can view all circuit milestones'
    ) THEN
        CREATE POLICY "Admins can view all circuit milestones" 
        ON public.circuit_milestones 
        FOR SELECT 
        USING (public.get_current_user_role() = 'admin');
    END IF;

    -- Admin policies for managing circuit tracking
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_tracking' 
        AND policyname = 'Admins can insert circuit tracking'
    ) THEN
        CREATE POLICY "Admins can insert circuit tracking" 
        ON public.circuit_tracking 
        FOR INSERT 
        WITH CHECK (public.get_current_user_role() = 'admin');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_tracking' 
        AND policyname = 'Admins can update circuit tracking'
    ) THEN
        CREATE POLICY "Admins can update circuit tracking" 
        ON public.circuit_tracking 
        FOR UPDATE 
        USING (public.get_current_user_role() = 'admin');
    END IF;

    -- Admin policies for managing circuit milestones
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_milestones' 
        AND policyname = 'Admins can insert circuit milestones'
    ) THEN
        CREATE POLICY "Admins can insert circuit milestones" 
        ON public.circuit_milestones 
        FOR INSERT 
        WITH CHECK (public.get_current_user_role() = 'admin');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'circuit_milestones' 
        AND policyname = 'Admins can update circuit milestones'
    ) THEN
        CREATE POLICY "Admins can update circuit milestones" 
        ON public.circuit_milestones 
        FOR UPDATE 
        USING (public.get_current_user_role() = 'admin');
    END IF;
END $$;
