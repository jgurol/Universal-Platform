import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientContact, AddClientContactData, UpdateClientContactData } from "@/types/clientContacts";

export const useClientContacts = (clientInfoId: string | null) => {
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchContacts = async () => {
    if (!clientInfoId) {
      console.log('useClientContacts - No clientInfoId provided');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('useClientContacts - Fetching contacts for clientInfoId:', clientInfoId);
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_info_id', clientInfoId)
        .order('first_name');

      if (error) {
        console.error('useClientContacts - Error fetching contacts:', error);
        throw error;
      }
      
      console.log('useClientContacts - Fetched contacts:', data);
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
    if (!clientInfoId) {
      console.error('useClientContacts - Cannot add contact: No clientInfoId provided');
      toast({
        title: "Error",
        description: "No client ID provided",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('useClientContacts - Adding contact:', { ...contactData, client_info_id: clientInfoId });
      
      // First, let's check if the user owns this client
      const { data: clientCheck, error: clientError } = await supabase
        .from('client_info')
        .select('id, user_id, company_name')
        .eq('id', clientInfoId)
        .single();

      if (clientError) {
        console.error('useClientContacts - Error checking client ownership:', clientError);
        throw clientError;
      }

      console.log('useClientContacts - Client check result:', clientCheck);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('useClientContacts - Error getting current user:', userError);
        throw userError;
      }

      console.log('useClientContacts - Current user ID:', user?.id);
      console.log('useClientContacts - Client owner ID:', clientCheck?.user_id);

      if (clientCheck?.user_id !== user?.id) {
        console.error('useClientContacts - User does not own this client');
        toast({
          title: "Error",
          description: "You don't have permission to add contacts to this client",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('client_contacts')
        .insert({
          ...contactData,
          client_info_id: clientInfoId
        })
        .select()
        .single();

      if (error) {
        console.error('useClientContacts - Error adding contact:', error);
        throw error;
      }

      console.log('useClientContacts - Contact added successfully:', data);
      setContacts(prev => [...prev, data]);
      toast({
        title: "Contact added",
        description: `${data.first_name} ${data.last_name} has been added successfully.`
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive"
      });
    }
  };

  const updateContact = async (contactData: UpdateClientContactData) => {
    try {
      console.log('useClientContacts - Updating contact:', contactData);
      
      const { data, error } = await supabase
        .from('client_contacts')
        .update({
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          email: contactData.email,
          phone: contactData.phone,
          title: contactData.title,
          is_primary: contactData.is_primary
        })
        .eq('id', contactData.id)
        .select()
        .single();

      if (error) {
        console.error('useClientContacts - Error updating contact:', error);
        throw error;
      }

      console.log('useClientContacts - Contact updated successfully:', data);
      setContacts(prev => prev.map(contact => 
        contact.id === data.id ? data : contact
      ));
      toast({
        title: "Contact updated",
        description: `${data.first_name} ${data.last_name} has been updated successfully.`
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contact",
        variant: "destructive"
      });
    }
  };

  const setPrimaryContact = async (contactId: string) => {
    if (!clientInfoId) {
      console.error('useClientContacts - Cannot set primary: No clientInfoId provided');
      return;
    }

    try {
      console.log('useClientContacts - Setting primary contact:', contactId, 'for client:', clientInfoId);
      
      // First, unset all primary contacts for this client
      const { error: unsetError } = await supabase
        .from('client_contacts')
        .update({ is_primary: false })
        .eq('client_info_id', clientInfoId);

      if (unsetError) {
        console.error('useClientContacts - Error unsetting primary contacts:', unsetError);
        throw unsetError;
      }

      // Then, set the selected contact as primary
      const { data, error } = await supabase
        .from('client_contacts')
        .update({ is_primary: true })
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        console.error('useClientContacts - Error setting primary contact:', error);
        throw error;
      }

      console.log('useClientContacts - Primary contact set successfully:', data);
      // Refresh the contacts list to get the updated data
      await fetchContacts();

      toast({
        title: "Primary contact updated",
        description: `${data.first_name} ${data.last_name} has been set as the primary contact.`
      });
    } catch (error) {
      console.error('Error setting primary contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set primary contact",
        variant: "destructive"
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      console.log('useClientContacts - Deleting contact:', contactId);
      
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        console.error('useClientContacts - Error deleting contact:', error);
        throw error;
      }

      console.log('useClientContacts - Contact deleted successfully');
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast({
        title: "Contact deleted",
        description: "Contact has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contact",
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
    deleteContact,
    setPrimaryContact
  };
};
