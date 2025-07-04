
import { supabase } from "@/integrations/supabase/client";
import { ClientInfo } from "@/types/index";
import { AddClientInfoData, UpdateClientInfoData } from "@/types/clientManagement";

export const clientInfoService = {
  async fetchClientInfos(userId?: string, associatedAgentId?: string | null, isAdmin?: boolean): Promise<ClientInfo[]> {
    let query = supabase
      .from('client_info')
      .select(`
        *,
        credit_score,
        credit_rating,
        credit_risk_level,
        credit_recommendation,
        credit_check_date
      `);
    
    // Admin users can see all clients - no filtering needed
    if (isAdmin) {
      console.log('[clientInfoService] Admin user - fetching all clients');
    } else if (associatedAgentId) {
      // Non-admin users with associated agent - filter by that agent
      console.log('[clientInfoService] Non-admin user with agent - filtering by agent:', associatedAgentId);
      query = query.eq('agent_id', associatedAgentId);
    } else if (userId) {
      // Non-admin users without agent - show only their own clients
      console.log('[clientInfoService] Non-admin user without agent - filtering by user_id:', userId);
      query = query.eq('user_id', userId);
    }
    
    // Always sort by company name in ascending order
    const { data, error } = await query.order('company_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching client info:', error);
      throw error;
    }
    
    console.log('[clientInfoService] Fetched clients count:', data?.length || 0);
    
    // Transform the data to match ClientInfo interface
    return (data || []).map(info => ({
      id: info.id,
      user_id: info.user_id,
      company_name: info.company_name,
      notes: info.notes,
      revio_id: info.revio_id,
      agent_id: info.agent_id,
      created_at: info.created_at,
      updated_at: info.updated_at,
      commission_override: info.commission_override,
      credit_score: info.credit_score,
      credit_rating: info.credit_rating,
      credit_risk_level: info.credit_risk_level,
      credit_recommendation: info.credit_recommendation,
      credit_check_date: info.credit_check_date
    }));
  },

  async addClientInfo(clientData: AddClientInfoData, userId: string): Promise<ClientInfo> {
    const clientInfoToInsert = {
      ...clientData,
      agent_id: (!clientData.agent_id || clientData.agent_id === "none" || clientData.agent_id === "") ? null : clientData.agent_id,
      user_id: userId,
      notes: clientData.notes || null
    };

    const { data, error } = await supabase
      .from('client_info')
      .insert(clientInfoToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding client info:', error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      company_name: data.company_name,
      notes: data.notes,
      revio_id: data.revio_id,
      agent_id: data.agent_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      commission_override: data.commission_override
    };
  },

  async updateClientInfo(clientData: UpdateClientInfoData): Promise<ClientInfo> {
    const clientInfoToUpdate = {
      ...clientData,
      agent_id: (!clientData.agent_id || clientData.agent_id === "none" || clientData.agent_id === "") ? null : clientData.agent_id,
      notes: clientData.notes || null
    };

    const { data, error } = await supabase
      .from('client_info')
      .update({
        company_name: clientInfoToUpdate.company_name,
        notes: clientInfoToUpdate.notes,
        revio_id: clientInfoToUpdate.revio_id,
        agent_id: clientInfoToUpdate.agent_id,
        commission_override: clientInfoToUpdate.commission_override
      })
      .eq('id', clientInfoToUpdate.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating client info:', error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      company_name: data.company_name,
      notes: data.notes,
      revio_id: data.revio_id,
      agent_id: data.agent_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      commission_override: data.commission_override
    };
  }
};
