
export interface CircuitQuote {
  id: string;
  client_name: string;
  client_info_id: string | null;
  deal_registration_id: string | null; // Add deal registration association
  location: string;
  suite: string;
  created_at: string;
  status: 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer';
  static_ip: boolean;
  slash_29: boolean;
  dhcp: boolean;
  mikrotik_required: boolean;
  user_id?: string; // Add user_id to identify creator
  categories: string[]; // Add categories to display selected circuit categories
  carriers: CarrierQuote[];
}

export interface CarrierQuote {
  id: string;
  circuit_quote_id: string;
  carrier: string;
  type: string;
  speed: string;
  price: number;
  notes: string;
  term: string;
  color: string;
  install_fee: boolean;
  install_fee_amount: number;
  site_survey_needed: boolean;
  no_service: boolean;
  static_ip: boolean;
  static_ip_fee_amount: number;
  static_ip_5: boolean;
  static_ip_5_fee_amount: number;
}
