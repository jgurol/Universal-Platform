
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
        street_address_2: addressData.street_address_2,
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
    console.log('[clientAddressService] Starting deletion check for address:', addressId);
    
    // Check if this address is referenced by any quote items
    const { data: quoteItems, error: quoteItemsError } = await supabase
      .from('quote_items')
      .select(`
        id, 
        quote_id,
        quote:quotes(quote_number)
      `)
      .eq('address_id', addressId);

    if (quoteItemsError) {
      console.error('Error checking quote items references:', quoteItemsError);
      throw quoteItemsError;
    }

    console.log('[clientAddressService] Quote items using this address:', quoteItems);

    // Get the address details to check for text-based references in quotes
    const { data: addressDetails, error: addressError } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (addressError) {
      console.error('Error fetching address details:', addressError);
      throw addressError;
    }

    // Create a search pattern for the address text
    const addressText = `${addressDetails.street_address}, ${addressDetails.city}, ${addressDetails.state} ${addressDetails.zip_code}`;
    
    // Check if this address text is used in quotes' billing_address or service_address fields
    const { data: quotesUsingAddress, error: quotesError } = await supabase
      .from('quotes')
      .select('id, quote_number, billing_address, service_address')
      .or(`billing_address.ilike.%${addressText}%,service_address.ilike.%${addressText}%`);

    if (quotesError) {
      console.error('Error checking quotes references:', quotesError);
      throw quotesError;
    }

    console.log('[clientAddressService] Quotes using this address in billing/service fields:', quotesUsingAddress);

    // If there are any references, provide detailed error message with quote numbers
    if ((quoteItems && quoteItems.length > 0) || (quotesUsingAddress && quotesUsingAddress.length > 0)) {
      let errorMessage = 'This address cannot be deleted because it is being used in existing quotes:';
      
      if (quoteItems && quoteItems.length > 0) {
        const quoteNumbers = quoteItems
          .map(item => item.quote?.quote_number || `Quote ${item.quote_id}`)
          .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        errorMessage += `\n- Referenced in ${quoteItems.length} quote item(s) in: ${quoteNumbers.join(', ')}`;
      }
      
      if (quotesUsingAddress && quotesUsingAddress.length > 0) {
        const quoteNumbers = quotesUsingAddress.map(quote => quote.quote_number || `Quote ${quote.id}`);
        errorMessage += `\n- Used as billing/service address in: ${quoteNumbers.join(', ')}`;
      }
      
      errorMessage += '\n\nPlease remove these references first before deleting the address.';
      throw new Error(errorMessage);
    }

    // If no references found, proceed with deletion
    const { error } = await supabase
      .from('client_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('Error deleting client address:', error);
      if (error.code === '23503') {
        throw new Error('This address cannot be deleted because it is still being referenced. Please check all quotes and remove any references first.');
      }
      throw error;
    }

    console.log('[clientAddressService] Address deleted successfully:', addressId);
  }
};
