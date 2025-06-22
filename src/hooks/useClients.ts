
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  companyName: string | null;
  commissionRate: number;
  totalEarnings: number;
  lastPayment: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchClients = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: agentsData, error } = await supabase
        .from('agents')
        .select('*');

      if (error) {
        console.error('Error fetching agents:', error);
        setClients([]);
        return;
      }

      if (agentsData) {
        const formattedClients = agentsData.map(agent => ({
          id: agent.id,
          firstName: agent.first_name || '',
          lastName: agent.last_name || '',
          name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim(),
          email: agent.email || '',
          companyName: agent.company_name,
          commissionRate: parseFloat(agent.commission_rate?.toString() || '0'),
          totalEarnings: parseFloat(agent.total_earnings?.toString() || '0'),
          lastPayment: agent.last_payment || new Date().toISOString()
        }));

        setClients(formattedClients);
      }
    } catch (err) {
      console.error('Error in fetchClients:', err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  return {
    clients,
    setClients,
    isLoading,
    refetch: fetchClients,
    fetchClients
  };
};
