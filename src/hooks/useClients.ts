
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
      
      let query = supabase.from('agents').select('*');
      
      // If not admin and has associated agent, filter by that agent
      if (!isAdmin && associatedAgentId) {
        query = query.eq('id', associatedAgentId);
      }
      
      const { data: agentsData, error } = await query;
      
      if (error) {
        console.error('Error fetching agents:', error);
        return;
      }

      if (agentsData) {
        const mappedClients = agentsData.map(agent => ({
          id: agent.id,
          firstName: agent.first_name,
          lastName: agent.last_name,
          name: `${agent.first_name} ${agent.last_name}`,
          email: agent.email,
          companyName: agent.company_name,
          commissionRate: agent.commission_rate || 0,
          totalEarnings: agent.total_earnings || 0,
          lastPayment: agent.last_payment || new Date().toISOString(),
        }));
        
        setClients(mappedClients);
        console.info('[fetchClients] Fetched agents:', mappedClients.length);
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
