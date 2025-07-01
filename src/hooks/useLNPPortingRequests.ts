
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LNPNumber {
  id: string;
  phone_number: string;
  current_service_type?: string;
}

export interface LNPPortingRequest {
  id: string;
  user_id: string;
  client_info_id?: string;
  status: 'pending' | 'submitted' | 'approved' | 'completed';
  current_carrier: string;
  account_number?: string;
  billing_phone_number?: string;
  authorized_contact_name: string;
  authorized_contact_title?: string;
  business_name: string;
  service_address: string;
  billing_address?: string;
  phone_bill_file_path?: string;
  phone_bill_file_name?: string;
  signature_data?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  numbers?: LNPNumber[];
  client_info?: {
    id: string;
    company_name: string;
  };
}

export interface CreateLNPRequestData {
  client_info_id?: string;
  current_carrier: string;
  account_number?: string;
  billing_phone_number?: string;
  authorized_contact_name: string;
  authorized_contact_title?: string;
  business_name: string;
  service_address: string;
  billing_address?: string;
  notes?: string;
}

export const useLNPPortingRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lnpRequests, setLNPRequests] = useState<LNPPortingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLNPRequests = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lnp_porting_requests')
        .select(`
          *,
          client_info (
            id,
            company_name
          ),
          lnp_numbers (
            id,
            phone_number,
            current_service_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData: LNPPortingRequest[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'submitted' | 'approved' | 'completed',
        numbers: item.lnp_numbers || []
      }));
      
      setLNPRequests(transformedData);
    } catch (error) {
      console.error('Error fetching LNP requests:', error);
      toast({
        title: "Error",
        description: "Failed to load LNP requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createLNPRequest = async (requestData: CreateLNPRequestData, numbers: string[]) => {
    if (!user) return;

    try {
      const { data: request, error: requestError } = await supabase
        .from('lnp_porting_requests')
        .insert({
          user_id: user.id,
          client_info_id: requestData.client_info_id,
          current_carrier: requestData.current_carrier,
          account_number: requestData.account_number,
          billing_phone_number: requestData.billing_phone_number,
          authorized_contact_name: requestData.authorized_contact_name,
          authorized_contact_title: requestData.authorized_contact_title,
          business_name: requestData.business_name,
          service_address: requestData.service_address,
          billing_address: requestData.billing_address,
          notes: requestData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Insert numbers
      if (numbers.length > 0) {
        const numbersData = numbers.map(number => ({
          lnp_porting_request_id: request.id,
          phone_number: number
        }));

        const { error: numbersError } = await supabase
          .from('lnp_numbers')
          .insert(numbersData);

        if (numbersError) throw numbersError;
      }

      await fetchLNPRequests();
      toast({
        title: "Success",
        description: "LNP port request created successfully"
      });
    } catch (error: any) {
      console.error('Error creating LNP request:', error);
      toast({
        title: "Error",
        description: "Failed to create LNP request",
        variant: "destructive"
      });
    }
  };

  const updateLNPRequest = async (requestId: string, updates: Partial<LNPPortingRequest>) => {
    try {
      const { error } = await supabase
        .from('lnp_porting_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      setLNPRequests(prev => prev.map(request => 
        request.id === requestId ? { ...request, ...updates } : request
      ));

      toast({
        title: "Success",
        description: "LNP request updated successfully"
      });
    } catch (error) {
      console.error('Error updating LNP request:', error);
      toast({
        title: "Error",
        description: "Failed to update LNP request",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchLNPRequests();
  }, [user]);

  return {
    lnpRequests,
    loading,
    createLNPRequest,
    updateLNPRequest,
    refetch: fetchLNPRequests
  };
};
