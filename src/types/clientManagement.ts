
import { ClientInfo } from "@/pages/Index";

export interface AddClientInfoData {
  company_name: string;
  notes?: string;
  revio_id?: string;
  agent_id?: string | null;
  commission_override?: number | null;
}

export interface UpdateClientInfoData {
  id: string;
  company_name: string;
  notes?: string;
  revio_id?: string;
  agent_id?: string | null;
  commission_override?: number | null;
}

export interface ClientManagementHook {
  clientInfos: ClientInfo[];
  isLoading: boolean;
  agentMapping: Record<string, string>;
  addClientInfo: (clientInfo: AddClientInfoData) => Promise<void>;
  updateClientInfo: (clientInfo: ClientInfo) => Promise<void>;
}
