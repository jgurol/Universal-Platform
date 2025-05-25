
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/pages/Index";

export const calculateCommission = async (
  amount: number,
  clientId: string,
  clients: Client[],
  clientInfoId?: string,
  quoteOverride?: number
): Promise<number> => {
  // 1. Quote override takes highest precedence
  if (quoteOverride !== undefined && quoteOverride !== null) {
    return (quoteOverride / 100) * amount;
  }

  // 2. Client override takes second precedence
  if (clientInfoId) {
    const { data: clientInfo } = await supabase
      .from('client_info')
      .select('commission_override')
      .eq('id', clientInfoId)
      .single();

    if (clientInfo?.commission_override !== null && clientInfo?.commission_override !== undefined) {
      return (clientInfo.commission_override / 100) * amount;
    }
  }

  // 3. Agent commission rate is the default
  const client = clients.find(c => c.id === clientId);
  if (client) {
    return (client.commissionRate / 100) * amount;
  }

  return 0;
};
