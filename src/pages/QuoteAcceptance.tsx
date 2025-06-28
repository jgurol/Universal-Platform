import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle } from 'lucide-react';
import { QuoteItemsDisplay } from '@/components/QuoteAcceptance/QuoteItemsDisplay';

interface Quote {
  id: string;
  quote_number: string;
  description: string;
  amount: number;
  date: string;
  expires_at: string;
  term?: string;
  quote_items: any[];
}

interface ClientInfo {
  id: string;
  company_name: string;
}

export default function QuoteAcceptance() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    agreesToTerms: false,
  });
  
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);

  useEffect(() => {
    if (quoteId) {
      loadQuoteData();
    }
  }, [quoteId]);

  const loadQuoteData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading quote data for ID:', quoteId);
      
      // Check if quote has already been accepted
      const { data: acceptanceData } = await supabase
        .from('quote_acceptances')
        .select('*')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (acceptanceData) {
        console.log('Quote already accepted');
        setIsAccepted(true);
        setIsLoading(false);
        return;
      }

      // Load quote with items and client info
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            *,
            items (
              name,
              description
            )
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error loading quote:', quoteError);
        setError('Quote not found or has expired');
        setIsLoading(false);
        return;
      }

      // Check if quote has expired
      if (quoteData.expires_at) {
        const expirationDate = new Date(quoteData.expires_at);
        const currentDate = new Date();
        
        if (expirationDate < currentDate) {
          setError('This quote has expired');
          setIsLoading(false);
          return;
        }
      }

      setQuote(quoteData);

      // Load client info
      if (quoteData.client_info_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('client_info')
          .select('*')
          .eq('id', quoteData.client_info_id)
          .single();

        if (!clientError && clientData) {
          setClientInfo(clientData);
        }
      }

    } catch (error) {
      console.error('Error loading quote data:', error);
      setError('Failed to load quote information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || !signatureRef) return;

    // Validate required fields
    if (!formData.agreesToTerms) {
      toast({
        title: 'Agreement required',
        description: 'You must agree to the terms and conditions.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      toast({
        title: 'Information required',
        description: 'Please provide your name and email address.',
        variant: 'destructive'
      });
      return;
    }

    if (signatureRef.isEmpty()) {
      toast({
        title: 'Signature required',
        description: 'Please provide your digital signature.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get signature data
      const signatureData = signatureRef.toDataURL();

      // Get client IP and user agent
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      // Submit acceptance
      const { error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .insert({
          quote_id: quote.id,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          signature_data: signatureData,
          ip_address: ip,
          user_agent: navigator.userAgent,
        });

      if (acceptanceError) {
        throw new Error('Failed to submit acceptance');
      }

      // Update quote status
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'approved',
          accepted_by: formData.clientName,
          accepted_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      if (updateError) {
        console.error('Error updating quote status:', updateError);
        // Don't throw here as the acceptance was saved
      }

      setIsAccepted(true);
      toast({
        title: 'Quote accepted!',
        description: 'Your quote has been accepted successfully.',
      });

    } catch (error) {
      console.error('Error submitting acceptance:', error);
      toast({
        title: 'Submission failed',
        description: 'There was an error accepting the quote. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading quote information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Quote Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">Quote Accepted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Thank you for accepting this quote. We will process your order and contact you soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Quote Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested quote could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Quote Acceptance</CardTitle>
            <p className="text-sm text-gray-600">
              Please review and accept this quote
            </p>
            <div className="flex justify-end">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                pending
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Quote Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quote Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Quote Number:</span>
                    <span className="ml-2">{quote.quote_number}</span>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">{new Date(quote.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span>
                    <span className="ml-2">
                      {quote.expires_at ? new Date(quote.expires_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <span className="ml-2">{quote.description}</span>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                    <span className="font-medium">{clientInfo?.company_name || 'Company Name'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Items - Using the new component */}
            <div className="mb-8">
              <QuoteItemsDisplay items={quote.quote_items || []} />
            </div>

            {/* Totals */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monthly Recurring Charges (MRC):</span>
                  <span>${quote.quote_items?.filter(item => item.charge_type === 'MRC').reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Recurring Charges (NRC):</span>
                  <span>${quote.quote_items?.filter(item => item.charge_type === 'NRC').reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Quote Value:</span>
                  <span>${quote.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            {quote.term && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium mb-2">Debug Info</h4>
                <div className="text-sm space-y-1">
                  <div>Quote term value: "{quote.term}"</div>
                  <div>Term exists: {quote.term ? 'true' : 'false'}</div>
                  <div>Term not empty: {quote.term ? 'true' : 'false'}</div>
                </div>
              </div>
            )}

            {/* Initial Term */}
            {quote.term && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Initial Term</h4>
                <div className="p-3 bg-gray-50 rounded">
                  {quote.term}
                </div>
              </div>
            )}

            {/* Acceptance Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email Address *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {/* Digital Signature */}
              <div>
                <Label>Digital Signature *</Label>
                <div className="border border-gray-300 rounded-md">
                  <SignatureCanvas
                    ref={(ref) => setSignatureRef(ref)}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full',
                      style: { border: '1px solid #e5e7eb', borderRadius: '6px' }
                    }}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => signatureRef?.clear()}
                  >
                    Clear Signature
                  </Button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreesToTerms"
                  checked={formData.agreesToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreesToTerms: checked === true }))
                  }
                />
                <Label htmlFor="agreesToTerms" className="text-sm leading-relaxed">
                  I agree to the terms and conditions outlined in this quote and authorize the work to proceed as specified.
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="px-8 py-3"
                >
                  {isSubmitting ? 'Processing...' : 'Accept Quote'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
