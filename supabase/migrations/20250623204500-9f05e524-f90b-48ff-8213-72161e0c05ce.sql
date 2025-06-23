
-- Create a function to create orders that bypasses RLS (fixed parameter order)
CREATE OR REPLACE FUNCTION public.create_order_bypass_rls(
  p_quote_id UUID,
  p_order_number TEXT,
  p_user_id UUID,
  p_amount NUMERIC,
  p_status TEXT DEFAULT 'pending',
  p_commission NUMERIC DEFAULT 0,
  p_client_id UUID DEFAULT NULL,
  p_client_info_id UUID DEFAULT NULL,
  p_billing_address TEXT DEFAULT NULL,
  p_service_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_commission_override NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
BEGIN
  INSERT INTO public.orders (
    quote_id,
    order_number,
    user_id,
    client_id,
    client_info_id,
    amount,
    status,
    billing_address,
    service_address,
    notes,
    commission,
    commission_override
  ) VALUES (
    p_quote_id,
    p_order_number,
    p_user_id,
    p_client_id,
    p_client_info_id,
    p_amount,
    p_status,
    p_billing_address,
    p_service_address,
    p_notes,
    p_commission,
    p_commission_override
  ) RETURNING id INTO new_order_id;
  
  RETURN new_order_id;
END;
$$;
