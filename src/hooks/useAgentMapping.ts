
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAgentMapping = () => {
  const [agentMapping, setAgentMapping] = useState<Record<string, string>>({});

  const fetchAgentNames = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, company_name, first_name, last_name');
      
      if (error) {
        console.error('Error fetching salespersons:', error);
      } else if (data) {
        const mapping: Record<string, string> = {};
        data.forEach(agent => {
          mapping[agent.id] = agent.company_name || `${agent.first_name} ${agent.last_name}`;
        });
        setAgentMapping(mapping);
      }
    } catch (err) {
      console.error('Error creating salesperson mapping:', err);
    }
  };

  useEffect(() => {
    fetchAgentNames();
  }, []);

  return { agentMapping, fetchAgentNames };
};
