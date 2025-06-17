
import { useState, useEffect } from "react";
import { ClientAddress, AddClientAddressData, UpdateClientAddressData } from "@/types/clientAddress";
import { useToast } from "@/hooks/use-toast";
import { clientAddressService } from "@/services/clientAddressService";

export const useClientAddresses = (clientInfoId: string | null) => {
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load addresses when clientInfoId changes
  useEffect(() => {
    if (clientInfoId) {
      fetchAddresses(clientInfoId);
    } else {
      setAddresses([]);
    }
  }, [clientInfoId]);

  const fetchAddresses = async (clientId: string) => {
    setIsLoading(true);
    try {
      const data = await clientAddressService.fetchClientAddresses(clientId);
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      toast({
        title: "Failed to load addresses",
        description: err instanceof Error ? err.message : "Failed to load client addresses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAddress = async (addressData: AddClientAddressData) => {
    try {
      const newAddress = await clientAddressService.addClientAddress(addressData);
      // Immediately update the state with the new address
      setAddresses(prevAddresses => [...prevAddresses, newAddress]);
      toast({
        title: "Address added",
        description: "The address has been added successfully.",
        variant: "default"
      });
      return newAddress; // Return the new address for immediate use
    } catch (err) {
      console.error('Error adding address:', err);
      toast({
        title: "Failed to add address",
        description: err instanceof Error ? err.message : "Failed to add address",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateAddress = async (addressData: UpdateClientAddressData) => {
    try {
      const updatedAddress = await clientAddressService.updateClientAddress(addressData);
      setAddresses(addresses.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr));
      toast({
        title: "Address updated",
        description: "The address has been updated successfully.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error updating address:', err);
      toast({
        title: "Failed to update address",
        description: err instanceof Error ? err.message : "Failed to update address",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      await clientAddressService.deleteClientAddress(addressId);
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      toast({
        title: "Address deleted",
        description: "The address has been deleted successfully.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error deleting address:', err);
      toast({
        title: "Failed to delete address",
        description: err instanceof Error ? err.message : "Failed to delete address",
        variant: "destructive"
      });
      throw err;
    }
  };

  return {
    addresses,
    isLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    refetchAddresses: () => clientInfoId && fetchAddresses(clientInfoId)
  };
};
