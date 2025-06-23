
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClientInfo } from "@/types/index";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  accepted_at?: string;
  billing_address?: string;
  service_address?: string;
  template_id?: string;
  email_status?: string;
  acceptance_status?: string;
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

      // Check if quote is already accepted
      if (quoteData.acceptance_status === 'accepted') {
        console.log('Quote already accepted');
        setIsAccepted(true);
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
        .select('id')
        .eq('quote_id', quote.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing acceptance:', checkError);
        throw new Error('Failed to check acceptance status');
      }

      if (existingAcceptance) {
        console.log('Quote already accepted, showing success state');
        setIsAccepted(true);
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

      // Update the quote with both acceptance fields AND status
      console.log('Updating quote acceptance status and main status...');
      
      const updateData = {
        acceptance_status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: clientName.trim(),
        status: 'approved' // Add this back to update the main status
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
              <div className="text-right">
                {quote.quote_number && (
                  <p className="text-sm text-gray-500">Quote #{quote.quote_number}</p>
                )}
                <p className="text-sm text-gray-500">
                  Date: {new Date(quote.date).toLocaleDateString()}
                </p>
                {quote.expires_at && (
                  <p className="text-sm text-red-600 flex items-center justify-end gap-1">
                    <Clock className="h-4 w-4" />
                    Expires: {new Date(quote.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Info */}
          {clientInfo && (
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">{clientInfo.company_name}</h4>
                  {primaryContact && (
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>{primaryContact.first_name} {primaryContact.last_name}</p>
                      {primaryContact.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {primaryContact.email}
                        </p>
                      )}
                      {primaryContact.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {primaryContact.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  {quote.billing_address && (
                    <div>
                      <h5 className="font-medium text-gray-700 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Billing Address
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">{quote.billing_address}</p>
                    </div>
                  )}
                  {quote.service_address && (
                    <div className="mt-3">
                      <h5 className="font-medium text-gray-700 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Service Address
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">{quote.service_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quote Items */}
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Description</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-center py-2">Type</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{item.item?.name}</p>
                          {item.item?.description && (
                            <p className="text-gray-600 text-xs">{item.item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-right py-3">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="text-center py-3">
                        <Badge variant={item.charge_type === 'MRC' ? 'default' : 'secondary'}>
                          {item.charge_type}
                        </Badge>
                      </td>
                      <td className="text-right py-3 font-medium">${Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={4} className="text-right py-3 font-semibold">Total Amount:</td>
                    <td className="text-right py-3 font-bold text-lg">${totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Acceptance Form */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accept Quote</h3>
            <div className="space-y-4">
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

              <div>
                <Label>Digital Signature *</Label>
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                  <SignatureCanvas
                    ref={(ref) => setSignaturePad(ref)}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full'
                    }}
                    onEnd={saveSignature}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">Please sign above</p>
                    <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Legal Notice:</strong> By signing this quote, you agree to the terms and conditions 
                  outlined in this proposal. This constitutes a legally binding agreement.
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleAcceptQuote}
                  disabled={isSubmitting || !clientName.trim() || !clientEmail.trim() || !signatureData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Processing...' : 'Accept Quote'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptQuote;
