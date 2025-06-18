
export interface CircuitQuote {
  id: string;
  client_name: string;
  client_info_id: string | null;
  location: string;
  suite: string;
  created_at: string;
  carriers: CarrierQuote[];
  status: 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer';
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
  static_ip: boolean;
  slash_29: boolean;
  install_fee: boolean;
  site_survey_needed: boolean;
  no_service: boolean;
}
