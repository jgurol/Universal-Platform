
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientContact, AddClientContactData, UpdateClientContactData } from "@/types/clientContacts";

export const useClientContacts = (clientInfoId: string | null) => {
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchContacts = async () => {
    if (!clientInfoId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_info_id', clientInfoId)
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async (contactData: AddClientContactData) => {
    if (!clientInfoId) return;

    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .insert({
          ...contactData,
          client_info_id: clientInfoId
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [...prev, data]);
      toast({
        title: "Contact added",
        description: `${data.name} has been added successfully.`
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive"
      });
    }
  };

  const updateContact = async (contactData: UpdateClientContactData) => {
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .update({
          name: contactData.name,
          email: contactData.email,
          role: contactData.role,
          is_primary: contactData.is_primary
        })
        .eq('id', contactData.id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(contact => 
        contact.id === data.id ? data : contact
      ));
      toast({
        title: "Contact updated",
        description: `${data.name} has been updated successfully.`
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast({
        title: "Contact deleted",
        description: "Contact has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [clientInfoId]);

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact
  };
};
