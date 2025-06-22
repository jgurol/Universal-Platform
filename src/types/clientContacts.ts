
export interface ClientContact {
  id: string;
  client_info_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddClientContactData {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
}

export interface UpdateClientContactData extends AddClientContactData {
  id: string;
}
