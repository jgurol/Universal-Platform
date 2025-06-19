
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@/pages/Index";

export const useClients = (associatedAgentId: string | null) => {
  const { user, isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  const fetchClients = async () => {
    if (!user) return;
    
    try {
      console.info('[fetchClients] Fetching clients - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
      let query = supabase.from('client_info').select('*');
      
      // If not admin and has associated agent, filter by that agent
      if (!isAdmin && associatedAgentId) {
        query = query.eq('agent_id', associatedAgentId);
      }
      
      const { data: clientsData, error } = await query.order('company_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      if (clientsData) {
        const mappedClients = clientsData.map(client => ({
          id: client.id,
          firstName: '',
          lastName: '',
          name: client.company_name,
          email: client.email || '',
          companyName: client.company_name,
          commissionRate: 0,
          totalEarnings: 0,
          lastPayment: new Date().toISOString(),
        }));
        
        setClients(mappedClients);
        console.info('[fetchClients] Fetched clients:', mappedClients.length);
      }
    } catch (err) {
      console.error('Error in fetchClients:', err);
    }
  };

  return {
    clients,
    setClients,
    fetchClients
  };
};
