
-- First, let's check what policies already exist and drop them to start fresh
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert any orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete any orders" ON public.orders;

-- Now create the correct policies for the orders table
CREATE POLICY "Users can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
  ON public.orders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" 
  ON public.orders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Admin policies for orders management
CREATE POLICY "Admins can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert any orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update any orders" 
  ON public.orders 
  FOR UPDATE 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete any orders" 
  ON public.orders 
  FOR DELETE 
  USING (public.get_current_user_role() = 'admin');
