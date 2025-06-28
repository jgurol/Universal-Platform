
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientInfo } from "@/types/index";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
}

export const useClientData = (clientInfoId: string | undefined) => {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClientData = async () => {
    if (!clientInfoId) return;

    try {
      setIsLoading(true);

      const { data: clientData, error: clientError } = await supabase
        .from('client_info')
        .select('*')
        .eq('id', clientInfoId)
        .single();

      if (!clientError && clientData) {
        const transformedClientInfo: ClientInfo = {
          id: clientData.id,
          user_id: clientData.user_id,
          company_name: clientData.company_name,
          notes: clientData.notes,
          revio_id: clientData.revio_id,
          agent_id: clientData.agent_id,
          created_at: clientData.created_at,
          updated_at: clientData.updated_at,
          commission_override: clientData.commission_override
        };
        
        setClientInfo(transformedClientInfo);

        // Fetch contacts for this client
        const { data: contactsData, error: contactsError } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_info_id', clientData.id);

        if (!contactsError && contactsData) {
          setContacts(contactsData);
          const primary = contactsData.find(contact => contact.is_primary);
          if (primary) {
            setPrimaryContact(primary);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [clientInfoId]);

  return {
    clientInfo,
    contacts,
    primaryContact,
    isLoading
  };
};
