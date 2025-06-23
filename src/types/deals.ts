
export interface AddDealData {
  deal_name: string;
  deal_value: number;
  stage: string;
  client_info_id: string;
  description?: string;
  expected_close_date?: string;
  probability?: number;
  source?: string;
  notes?: string;
}

export interface DealRegistration {
  id: string;
  deal_name: string;
  deal_value: number;
  stage: string;
  client_info_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  expected_close_date?: string;
  probability?: number;
  source?: string;
  notes?: string;
}
