
import { supabase } from "@/integrations/supabase/client";

export interface DealRegistration {
  id: string;
  user_id: string;
  agent_id: string | null;
  client_info_id: string | null;
  deal_name: string;
  deal_value: number;
  expected_close_date: string | null;
  probability: number;
  stage: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  archived?: boolean;
}

export interface AddDealData {
  deal_name: string;
  deal_value: number;
  expected_close_date: string | null;
  probability?: number;
  stage?: string;
  description?: string | null;
  notes?: string | null;
  client_info_id: string | null;
  agent_id: string | null;
}

export const dealRegistrationService = {
  async fetchDeals(showArchived: boolean = false): Promise<DealRegistration[]> {
    let query = supabase
      .from('deal_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (showArchived) {
      query = query.eq('archived', true);
    } else {
      query = query.or('archived.is.null,archived.eq.false');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }

    return data || [];
  },

  async addDeal(dealData: AddDealData, userId: string): Promise<DealRegistration> {
    // Convert empty strings to null for UUID fields and provide defaults for required fields
    const cleanedData = {
      ...dealData,
      client_info_id: dealData.client_info_id === '' ? null : dealData.client_info_id,
      agent_id: dealData.agent_id === '' ? null : dealData.agent_id,
      user_id: userId,
      // Provide defaults for required database fields that we no longer collect in the form
      probability: dealData.probability || 50,
      stage: dealData.stage || 'prospecting',
      status: 'active',
      description: dealData.description || null,
      notes: dealData.notes || null
    };

    const { data, error } = await supabase
      .from('deal_registrations')
      .insert(cleanedData)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding deal:', error);
      throw error;
    }

    return data;
  },

  async updateDeal(dealData: DealRegistration): Promise<DealRegistration> {
    // Convert empty strings to null for UUID fields
    const cleanedData = {
      deal_name: dealData.deal_name,
      deal_value: dealData.deal_value,
      expected_close_date: dealData.expected_close_date,
      client_info_id: dealData.client_info_id === '' ? null : dealData.client_info_id,
      agent_id: dealData.agent_id === '' ? null : dealData.agent_id,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('deal_registrations')
      .update(cleanedData)
      .eq('id', dealData.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      throw error;
    }

    return data;
  },

  async archiveDeal(dealId: string): Promise<void> {
    const { error } = await supabase
      .from('deal_registrations')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', dealId);

    if (error) {
      console.error('Error archiving deal:', error);
      throw error;
    }
  },

  async unarchiveDeal(dealId: string): Promise<void> {
    const { error } = await supabase
      .from('deal_registrations')
      .update({ archived: false, updated_at: new Date().toISOString() })
      .eq('id', dealId);

    if (error) {
      console.error('Error unarchiving deal:', error);
      throw error;
    }
  },

  async deleteDeal(dealId: string): Promise<void> {
    const { error } = await supabase
      .from('deal_registrations')
      .delete()
      .eq('id', dealId);

    if (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  }
};
