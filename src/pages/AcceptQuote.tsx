import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClientInfo } from "@/types/index";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, Clock, Building, Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignatureCanvas from 'react-signature-canvas';

interface Quote {
  id: string;
  user_id: string;
  client_id?: string;
  client_info_id?: string;
  amount: number;
  date: string;
  commission?: number;
  commission_override?: number;
  description?: string;
  quote_number?: string;
  quote_month?: string;
  quote_year?: string;
  status: string;
  notes?: string;
  expires_at?: string;
  billing_address?: string;
  service_address?: string;
  template_id?: string;
  email_status?: string;
  accepted_by?: string;
  email_sent_at?: string;
  email_opened?: boolean;
  email_opened_at?: string;
  email_open_count?: number;
  created_at: string;
  updated_at: string;
}

interface QuoteItem {
  id: string;
  quote_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  address_id?: string;
  item?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    cost: number;
    sku?: string;
    charge_type?: string;
    category_id?: string;
    vendor_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
}

const AcceptQuote = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateLoading, setTemplateLoading] = useState(false);
  
  // Form data
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (quoteId) {
      fetchQuoteData();
    } else {
      setError('Invalid quote link. Please check the URL and try again.');
      setIsLoading(false);
    }
  }, [quoteId]);

  const fetchQuoteData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching quote data for ID:', quoteId);

      // Fetch quote data
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error fetching quote:', quoteError);
        throw quoteError;
      }
      if (!quoteData) throw new Error('Quote not found');

      console.log('Quote data fetched:', quoteData);
      setQuote(quoteData);

      // Fetch template content if template_id exists
      if (quoteData.template_id) {
        setTemplateLoading(true);
        const { data: template, error: templateError } = await supabase
          .from('quote_templates')
          .select('content')
          .eq('id', quoteData.template_id)
          .single();

        if (!templateError && template) {
          setTemplateContent(template.content);
        }
        setTemplateLoading(false);
      }

      // Check if quote is already accepted by checking quote_acceptances table
      const { data: acceptanceData, error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .select('accepted_at')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (acceptanceError) {
        console.error('Error checking acceptance:', acceptanceError);
      }

      if (acceptanceData) {
        console.log('Quote already accepted at:', acceptanceData.accepted_at);
        setIsAccepted(true);
        setAcceptedAt(acceptanceData.accepted_at);
        setIsLoading(false);
        return;
      }

      // Check if quote is expired
      if (quoteData.expires_at && new Date(quoteData.expires_at) < new Date()) {
        setError('This quote has expired and can no longer be accepted.');
        setIsLoading(false);
        return;
      }
      
      // Fetch quote items with type assertion for charge_type
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          item:items(*)
        `)
        .eq('quote_id', quoteId);

      if (itemsError) throw itemsError;
      
      // Transform the data to ensure charge_type is properly typed
      const transformedItems: QuoteItem[] = (itemsData || []).map(item => ({
        ...item,
        charge_type: (item.charge_type === 'MRC' || item.charge_type === 'NRC') ? item.charge_type : 'NRC'
      }));
      
      setQuoteItems(transformedItems);

      // Fetch client info if available
      if (quoteData.client_info_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('client_info')
          .select('*')
          .eq('id', quoteData.client_info_id)
          .single();

        if (!clientError && clientData) {
          // Transform the data to match ClientInfo interface
          const transformedClientInfo: ClientInfo = {
            id: clientData.id,
            user_id: clientData.user_id,
            company_name: clientData.company_name,
            notes: clientData.notes,
            revio_id: clientData.revio_id,
            agent_id: clientData.agent_id,
            created_at: clientData.created_at,
            updated_at: clientData.updated_at,
            commission_override: clientData.commission_override
          };
          
          setClientInfo(transformedClientInfo);

          // Fetch contacts for this client
          const { data: contactsData, error: contactsError } = await supabase
            .from('client_contacts')
            .select('*')
            .eq('client_info_id', clientData.id);

          if (!contactsError && contactsData) {
            setContacts(contactsData);
            const primary = contactsData.find(contact => contact.is_primary);
            if (primary) {
              setPrimaryContact(primary);
              setClientName(`${primary.first_name} ${primary.last_name}`);
              setClientEmail(primary.email || '');
            }
          }
        }
      }

    } catch (err) {
      console.error('Error fetching quote data:', err);
      setError('Failed to load quote data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote || !clientName.trim() || !clientEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to accept the quote.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting quote acceptance process for quote:', quote.id);

      // First check if quote acceptance already exists
      const { data: existingAcceptance, error: checkError } = await supabase
        .from('quote_acceptances')
        .select('id, accepted_at')
        .eq('quote_id', quote.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing acceptance:', checkError);
        throw new Error('Failed to check acceptance status');
      }

      if (existingAcceptance) {
        console.log('Quote already accepted, showing success state');
        setIsAccepted(true);
        setAcceptedAt(existingAcceptance.accepted_at);
        toast({
          title: "Already Accepted",
          description: "This quote has already been accepted.",
        });
        return;
      }

      // Record the acceptance
      const acceptanceData = {
        quote_id: quote.id,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        signature_data: signatureData,
        ip_address: null,
        user_agent: navigator.userAgent
      };

      console.log('Inserting acceptance data...');

      const { data: acceptanceResult, error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .insert(acceptanceData)
        .select()
        .single();

      if (acceptanceError) {
        console.error('Error inserting acceptance:', acceptanceError);
        throw new Error(`Failed to record acceptance: ${acceptanceError.message}`);
      }

      console.log('Acceptance recorded successfully:', acceptanceResult);

      // Update the quote with accepted fields AND status (but not accepted_at since that's in quote_acceptances)
      console.log('Updating quote status...');
      
      const updateData = {
        accepted_by: clientName.trim(),
        status: 'approved' // Update the main status to approved
      };

      const { data: updateResult, error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quote.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating quote status:', updateError);
        // If the status update fails due to RLS, we'll handle it gracefully
        console.warn('Quote acceptance recorded but status update failed:', updateError.message);
        
        // Try a more direct approach using the service role via edge function
        try {
          console.log('Attempting status update via edge function...');
          const { data: statusResult, error: statusError } = await supabase.functions
            .invoke('fix-quote-approval', {
              body: { 
                quoteId: quote.id,
                action: 'update_status_only' // Add this flag to only update status
              }
            });

          if (statusError) {
            console.warn('Edge function status update also failed:', statusError);
          } else {
            console.log('Status updated successfully via edge function:', statusResult);
          }
        } catch (edgeErr) {
          console.warn('Edge function call failed:', edgeErr);
        }
      } else {
        console.log('Quote status updated successfully:', updateResult);
      }

      // Show success immediately
      setIsAccepted(true);
      setAcceptedAt(acceptanceResult.accepted_at);
      toast({
        title: "Quote Accepted",
        description: "Thank you! Your quote has been successfully accepted.",
      });

    } catch (err: any) {
      console.error('Quote acceptance process failed:', err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to accept quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignature = () => {
    if (signaturePad) {
      signaturePad.clear();
      setSignatureData('');
    }
  };

  const saveSignature = () => {
    if (signaturePad) {
      const dataURL = signaturePad.toDataURL();
      setSignatureData(dataURL);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Accepted</h2>
              {acceptedAt && (
                <p className="text-sm text-gray-500 mb-2">
                  Accepted on: {new Date(acceptedAt).toLocaleString()}
                </p>
              )}
              <p className="text-gray-600">This quote has already been accepted. Thank you!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
              <p className="text-gray-600">The requested quote could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMRCTotal = () => {
    return quoteItems
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + Number(item.total_price), 0);
  };

  const getNRCTotal = () => {
    return quoteItems
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + Number(item.total_price), 0);
  };

  const totalAmount = getMRCTotal() + getNRCTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
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
          </div>

          {/* Quote Details */}
          <div className="p-6 space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quote Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quote Number:</span>
                    <span className="font-medium">{quote.quote_number || `Q-${quote.id.slice(0, 8)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(quote.date).toLocaleDateString()}</span>
                  </div>
                  {quote.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">{new Date(quote.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{quote.description || 'Service Agreement'}</span>
                  </div>
                </div>
              </div>

              {/* Client Info */}
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

            {/* Quote Items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-4 py-2">
                          <div>
                            <div className="font-medium">{item.item?.name || 'Item'}</div>
                            {item.item?.description && (
                              <div className="text-sm text-gray-600">{item.item.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">${Number(item.unit_price).toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <Badge variant={item.charge_type === 'MRC' ? 'default' : 'secondary'}>
                            {item.charge_type}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                          ${Number(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2">
                {getMRCTotal() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Recurring Charges (MRC):</span>
                    <span className="font-medium">${getMRCTotal().toFixed(2)}/month</span>
                  </div>
                )}
                {getNRCTotal() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Non-Recurring Charges (NRC):</span>
                    <span className="font-medium">${getNRCTotal().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total Quote Value:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            {templateContent && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
                <div className="border rounded-lg">
                  <ScrollArea className="h-80 w-full p-4">
                    {templateLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p>Loading terms and conditions...</p>
                      </div>
                    ) : (
                      <div 
                        className="prose prose-sm max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: templateContent }}
                      />
                    )}
                  </ScrollArea>
                </div>
                <p className="text-xs text-gray-500">
                  Please review all terms and conditions above before accepting this quote.
                </p>
              </div>
            )}

            {/* Acceptance Form */}
            <Card>
              <CardHeader>
                <CardTitle>Accept Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Full Name *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email Address *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                {/* Digital Signature */}
                <div>
                  <Label>Digital Signature *</Label>
                  <div className="mt-2 border-2 border-gray-300 rounded-lg">
                    <SignatureCanvas
                      ref={(ref) => setSignaturePad(ref)}
                      canvasProps={{
                        width: 500,
                        height: 200,
                        className: 'signature-canvas w-full'
                      }}
                      onEnd={() => saveSignature()}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                    >
                      Clear Signature
                    </Button>
                    <p className="text-xs text-gray-500">Please sign above to accept this quote</p>
                  </div>
                </div>

                <Button
                  onClick={handleAcceptQuote}
                  disabled={isSubmitting || !clientName.trim() || !clientEmail.trim() || !signatureData}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Quote
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptQuote;
