
-- First, let's check if there are foreign key constraints that might be blocking deletion
-- and add proper cascade deletion for lnp_numbers when the parent request is deleted

-- Drop existing foreign key constraint if it exists (without cascade)
ALTER TABLE public.lnp_numbers 
DROP CONSTRAINT IF EXISTS lnp_numbers_lnp_porting_request_id_fkey;

-- Add foreign key constraint with CASCADE delete
ALTER TABLE public.lnp_numbers 
ADD CONSTRAINT lnp_numbers_lnp_porting_request_id_fkey 
FOREIGN KEY (lnp_porting_request_id) 
REFERENCES public.lnp_porting_requests(id) 
ON DELETE CASCADE;

-- Add RLS policies for lnp_porting_requests
ALTER TABLE public.lnp_porting_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own lnp requests" ON public.lnp_porting_requests;
DROP POLICY IF EXISTS "Users can create their own lnp requests" ON public.lnp_porting_requests;
DROP POLICY IF EXISTS "Users can update their own lnp requests" ON public.lnp_porting_requests;
DROP POLICY IF EXISTS "Users can delete their own lnp requests" ON public.lnp_porting_requests;

-- Create policies for lnp_porting_requests
CREATE POLICY "Users can view their own lnp requests" 
ON public.lnp_porting_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lnp requests" 
ON public.lnp_porting_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lnp requests" 
ON public.lnp_porting_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lnp requests" 
ON public.lnp_porting_requests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add RLS policies for lnp_numbers as well
ALTER TABLE public.lnp_numbers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view numbers for their own lnp requests" ON public.lnp_numbers;
DROP POLICY IF EXISTS "Users can create numbers for their own lnp requests" ON public.lnp_numbers;
DROP POLICY IF EXISTS "Users can update numbers for their own lnp requests" ON public.lnp_numbers;
DROP POLICY IF EXISTS "Users can delete numbers for their own lnp requests" ON public.lnp_numbers;

-- Create policies for lnp_numbers
CREATE POLICY "Users can view numbers for their own lnp requests" 
ON public.lnp_numbers 
FOR SELECT 
USING (
  lnp_porting_request_id IN (
    SELECT id FROM public.lnp_porting_requests WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create numbers for their own lnp requests" 
ON public.lnp_numbers 
FOR INSERT 
WITH CHECK (
  lnp_porting_request_id IN (
    SELECT id FROM public.lnp_porting_requests WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update numbers for their own lnp requests" 
ON public.lnp_numbers 
FOR UPDATE 
USING (
  lnp_porting_request_id IN (
    SELECT id FROM public.lnp_porting_requests WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete numbers for their own lnp requests" 
ON public.lnp_numbers 
FOR DELETE 
USING (
  lnp_porting_request_id IN (
    SELECT id FROM public.lnp_porting_requests WHERE user_id = auth.uid()
  )
);
