
export interface VendorPriceSheet {
  id: string;
  user_id: string;
  vendor_id?: string;
  name: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  uploaded_at: string;
  updated_at: string;
}
