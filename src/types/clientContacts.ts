
export interface ClientContact {
  id: string;
  client_info_id: string;
  name: string;
  email: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddClientContactData {
  name: string;
  email: string | null;
  role: string | null;
  is_primary: boolean;
}

export interface UpdateClientContactData extends AddClientContactData {
  id: string;
}
