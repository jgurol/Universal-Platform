
export interface CircuitQuote {
  id: string;
  client_name: string;
  client_info_id: string | null;
  location: string;
  suite: string;
  created_at: string;
  status: 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer';
  static_ip: boolean;
  slash_29: boolean;
  mikrotik_required: boolean;
  user_id?: string; // Add user_id to identify creator
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
  site_survey_needed: boolean;
  no_service: boolean;
  static_ip: boolean;
}
