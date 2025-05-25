
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AddressSuggestion {
  placeId: string;
  description: string;
}

interface ParsedAddress {
  street_number: string;
  route: string;
  locality: string;
  administrative_area_level_1: string;
  postal_code: string;
  country: string;
}

interface PlaceDetails {
  formattedAddress: string;
  addressComponents: ParsedAddress;
}

export const useAddressAutocomplete = () => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID());

  const searchAddresses = useCallback(async (input: string) => {
    if (!input || input.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('address-autocomplete', {
        body: { input, sessionToken }
      });

      if (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
        return;
      }

      const predictions = data?.predictions || [];
      const formattedSuggestions = predictions.map((prediction: any) => ({
        placeId: prediction.placePrediction?.placeId || prediction.placeId,
        description: prediction.placePrediction?.text?.text || prediction.description,
      }));

      setSuggestions(formattedSuggestions);
    } catch (err) {
      console.error('Error in searchAddresses:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('address-details', {
        body: { placeId, sessionToken }
      });

      if (error) {
        console.error('Error fetching place details:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getPlaceDetails:', err);
      return null;
    }
  }, [sessionToken]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    searchAddresses,
    getPlaceDetails,
    clearSuggestions,
  };
};
