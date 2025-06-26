
export interface VendorFolder {
  id: string;
  vendor_id: string;
  name: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorAttachment {
  id: string;
  vendor_id: string;
  folder_id?: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
