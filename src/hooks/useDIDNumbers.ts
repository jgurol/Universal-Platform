
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DIDNumber {
  id: string;
  did_number: string;
  status: 'available' | 'assigned';
  client_info_id?: string;
  client_info?: {
    id: string;
    company_name: string;
  };
  assigned_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useDIDNumbers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [didNumbers, setDIDNumbers] = useState<DIDNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDIDNumbers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('did_numbers')
        .select(`
          *,
          client_info (
            id,
            company_name
          )
        `)
        .eq('user_id', user.id)
        .order('did_number');

      if (error) throw error;
      
      // Transform and type cast the data
      const transformedData: DIDNumber[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'available' | 'assigned'
      }));
      
      setDIDNumbers(transformedData);
    } catch (error) {
      console.error('Error fetching DID numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load DID numbers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addDIDNumber = async (didNumber: string, notes?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('did_numbers')
        .insert({
          user_id: user.id,
          did_number: didNumber,
          status: 'available',
          notes
        })
        .select()
        .single();

      if (error) throw error;

      const transformedData: DIDNumber = {
        ...data,
        status: data.status as 'available' | 'assigned'
      };

      setDIDNumbers(prev => [...prev, transformedData]);
      toast({
        title: "Success",
        description: "DID number added successfully"
      });
    } catch (error: any) {
      console.error('Error adding DID number:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') 
          ? "This DID number already exists"
          : "Failed to add DID number",
        variant: "destructive"
      });
    }
  };

  const assignDIDToClient = async (didId: string, clientInfoId: string) => {
    try {
      const { data, error } = await supabase
        .from('did_numbers')
        .update({
          client_info_id: clientInfoId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', didId)
        .select(`
          *,
          client_info (
            id,
            company_name
          )
        `)
        .single();

      if (error) throw error;

      const transformedData: DIDNumber = {
        ...data,
        status: data.status as 'available' | 'assigned'
      };

      setDIDNumbers(prev => prev.map(did => 
        did.id === didId ? transformedData : did
      ));

      toast({
        title: "Success",
        description: "DID number assigned successfully"
      });
    } catch (error) {
      console.error('Error assigning DID number:', error);
      toast({
        title: "Error",
        description: "Failed to assign DID number",
        variant: "destructive"
      });
    }
  };

  const releaseDID = async (didId: string) => {
    try {
      const { data, error } = await supabase
        .from('did_numbers')
        .update({
          client_info_id: null,
          status: 'available',
          assigned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', didId)
        .select()
        .single();

      if (error) throw error;

      const transformedData: DIDNumber = {
        ...data,
        status: data.status as 'available' | 'assigned',
        client_info: undefined
      };

      setDIDNumbers(prev => prev.map(did => 
        did.id === didId ? transformedData : did
      ));

      toast({
        title: "Success",
        description: "DID number released successfully"
      });
    } catch (error) {
      console.error('Error releasing DID number:', error);
      toast({
        title: "Error",
        description: "Failed to release DID number",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchDIDNumbers();
  }, [user]);

  return {
    didNumbers,
    loading,
    addDIDNumber,
    assignDIDToClient,
    releaseDID,
    refetch: fetchDIDNumbers
  };
};
