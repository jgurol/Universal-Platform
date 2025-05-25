
export interface ClientAddress {
  id: string;
  client_info_id: string;
  address_type: string;
  street_address: string;
  street_address_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddClientAddressData {
  client_info_id: string;
  address_type: string;
  street_address: string;
  street_address_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_primary: boolean;
}

export interface UpdateClientAddressData extends AddClientAddressData {
  id: string;
}
