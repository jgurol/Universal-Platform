
import { supabase } from "@/integrations/supabase/client";
import { ClientAddress, AddClientAddressData, UpdateClientAddressData } from "@/types/clientAddress";

export const clientAddressService = {
  async fetchClientAddresses(clientInfoId: string): Promise<ClientAddress[]> {
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('client_info_id', clientInfoId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching client addresses:', error);
      throw error;
    }
    
    return data || [];
  },

  async addClientAddress(addressData: AddClientAddressData): Promise<ClientAddress> {
    const { data, error } = await supabase
      .from('client_addresses')
      .insert(addressData)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding client address:', error);
      throw error;
    }

    return data;
  },

  async updateClientAddress(addressData: UpdateClientAddressData): Promise<ClientAddress> {
    const { data, error } = await supabase
      .from('client_addresses')
      .update({
        address_type: addressData.address_type,
        street_address: addressData.street_address,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        country: addressData.country,
        is_primary: addressData.is_primary,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressData.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating client address:', error);
      throw error;
    }

    return data;
  },

  async deleteClientAddress(addressId: string): Promise<void> {
    const { error } = await supabase
      .from('client_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('Error deleting client address:', error);
      throw error;
    }
  }
};
