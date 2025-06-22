
import { Quote, ClientInfo, QuoteItem } from "@/pages/Index";

export interface PDFGenerationContext {
  quote: Quote;
  clientInfo?: ClientInfo;
  quoteItems: QuoteItem[];
  salespersonName: string;
  primaryContact?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    title: string | null;
  } | null;
}
