
import { Badge } from "@/components/ui/badge";
import { Building, Mail, Phone } from "lucide-react";

interface Quote {
  id: string;
  status: string;
  quoteNumber?: string;
  date: string;
  expiresAt?: string;
  description?: string;
}

interface ClientInfo {
  company_name: string;
}

interface Contact {
  email: string | null;
  phone: string | null;
}

interface QuoteInformationProps {
  quote: Quote;
  clientInfo: ClientInfo | null;
  primaryContact: Contact | null;
}

export const QuoteInformation = ({ quote, clientInfo, primaryContact }: QuoteInformationProps) => {
  return (
    <div className="border-b border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Acceptance</h1>
          <p className="text-gray-600 mt-1">Please review and accept this quote</p>
        </div>
        <Badge variant={quote.status === 'pending' ? 'secondary' : 'default'}>
          {quote.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Quote Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quote Number:</span>
              <span className="font-medium">{quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(quote.date).toLocaleDateString()}</span>
            </div>
            {quote.expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className="font-medium">{new Date(quote.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{quote.description || 'Service Agreement'}</span>
            </div>
          </div>
        </div>

        {clientInfo && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Company Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{clientInfo.company_name}</span>
              </div>
              {primaryContact && (
                <>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{primaryContact.email}</span>
                  </div>
                  {primaryContact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{primaryContact.phone}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
