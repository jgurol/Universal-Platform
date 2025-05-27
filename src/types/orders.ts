
export interface Order {
  id: string;
  quote_id: string;
  order_number: string;
  user_id: string;
  client_id?: string;
  client_info_id?: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  billing_address?: string;
  service_address?: string;
  notes?: string;
  commission?: number;
  commission_override?: number;
}

export interface CircuitTracking {
  id: string;
  order_id: string;
  quote_item_id?: string;
  circuit_type: string;
  stage?: string;
  progress_percentage: number;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  item_name?: string;
  item_description?: string;
  order?: {
    order_number: string;
  };
  quote_item?: {
    id: string;
    quantity: number;
    unit_price: number;
    item: {
      name: string;
      description?: string;
      category: {
        name: string;
      };
    };
    address?: {
      street_address: string;
      city: string;
      state: string;
    };
    quote?: {
      id: string;
      quote_number: string;
      client_info?: {
        company_name: string;
      };
      accepted_by?: string;
    };
  };
}

export interface CircuitMilestone {
  id: string;
  circuit_tracking_id: string;
  milestone_name: string;
  milestone_description?: string;
  target_date?: string;
  completed_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  created_at: string;
  updated_at: string;
  notes?: string;
}
