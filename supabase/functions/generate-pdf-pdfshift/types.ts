
export interface PDFRequest {
  quote: any;
  clientInfo?: any;
  salespersonName?: string;
}

export interface BusinessSettings {
  logoUrl: string;
  companyName: string;
}

export interface ProcessedContent {
  html: string;
  images: string[];
}
