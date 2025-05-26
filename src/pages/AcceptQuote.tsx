import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Quote, ClientInfo } from "@/pages/Index";
import { mapQuoteData } from "@/utils/quoteUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, FileText, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AcceptQuote = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [templateContent, setTemplateContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const fetchClientIp = async (): Promise<string> => {
    try {
      console.log('AcceptQuote - Fetching client IP address...');
      const { data, error } = await supabase.functions.invoke('get-client-ip');
      
      if (error) {
        console.error('AcceptQuote - Error fetching IP:', error);
        return '0.0.0.0';
      }

      const ip = data?.ip || '0.0.0.0';
      console.log('AcceptQuote - Client IP fetched:', ip);
      return ip;
    } catch (error) {
      console.error('AcceptQuote - Unexpected error fetching IP:', error);
      return '0.0.0.0';
    }
  };

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!quoteId) {
        console.error('AcceptQuote - No quote ID provided in URL params');
        setError("No quote ID provided");
        setIsLoading(false);
        return;
      }

      console.log('AcceptQuote - Starting to load quote with ID:', quoteId);
      console.log('AcceptQuote - Quote ID type:', typeof quoteId);
      console.log('AcceptQuote - Quote ID length:', quoteId.length);

      try {
        // Step 1: Check if quote is already accepted
        console.log('AcceptQuote - Checking for existing acceptance...');
        const { data: acceptance, error: acceptanceError } = await supabase
          .from('quote_acceptances')
          .select('*')
          .eq('quote_id', quoteId)
          .maybeSingle();

        if (acceptanceError) {
          console.error('AcceptQuote - Error checking acceptance:', acceptanceError);
        } else if (acceptance) {
          console.log('AcceptQuote - Quote already accepted:', acceptance);
          setIsAccepted(true);
          setIsLoading(false);
          return;
        }

        // Step 2: First, let's check if the quote exists at all
        console.log('AcceptQuote - Checking if quote exists in database...');
        const { data: basicQuoteCheck, error: basicError } = await supabase
          .from('quotes')
          .select('id, description, client_id, client_info_id')
          .eq('id', quoteId)
          .maybeSingle();

        console.log('AcceptQuote - Basic quote check result:', basicQuoteCheck);
        console.log('AcceptQuote - Basic quote check error:', basicError);

        if (basicError) {
          console.error('AcceptQuote - Error in basic quote check:', basicError);
          setError(`Database error during basic check: ${basicError.message}`);
          setIsLoading(false);
          return;
        }

        if (!basicQuoteCheck) {
          console.error('AcceptQuote - Quote not found in basic check with ID:', quoteId);
          setError("Quote not found - please check the quote ID");
          setIsLoading(false);
          return;
        }

        console.log('AcceptQuote - Quote found! Proceeding with full fetch...');

        // Step 3: Fetch quote with related data
        console.log('AcceptQuote - Fetching full quote data...');
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            *,
            quote_items (
              *,
              item:items(*),
              address:client_addresses(*)
            )
          `)
          .eq('id', quoteId)
          .maybeSingle();

        if (quoteError) {
          console.error('AcceptQuote - Error fetching full quote:', quoteError);
          setError(`Database error: ${quoteError.message}`);
          setIsLoading(false);
          return;
        }

        if (!quoteData) {
          console.error('AcceptQuote - No quote data returned in full fetch');
          setError("Quote not found - please check the quote ID");
          setIsLoading(false);
          return;
        }

        console.log('AcceptQuote - Full quote data loaded:', quoteData);

        // Step 4: Fetch agents and client_infos separately for proper mapping
        console.log('AcceptQuote - Fetching agents and client infos for mapping...');
        const [agentsResult, clientInfosResult] = await Promise.all([
          supabase.from('agents').select('*'),
          supabase.from('client_info').select('*')
        ]);

        if (agentsResult.error) {
          console.error('AcceptQuote - Error fetching agents:', agentsResult.error);
        }
        
        if (clientInfosResult.error) {
          console.error('AcceptQuote - Error fetching client infos:', clientInfosResult.error);
        }

        const rawAgents = agentsResult.data || [];
        const rawClientInfos = clientInfosResult.data || [];

        console.log('AcceptQuote - Raw agents count:', rawAgents.length);
        console.log('AcceptQuote - Raw client infos count:', rawClientInfos.length);

        // Transform raw database data to expected Client type
        const clients = rawAgents.map(agent => ({
          id: agent.id,
          firstName: agent.first_name,
          lastName: agent.last_name,
          name: `${agent.first_name} ${agent.last_name}`,
          email: agent.email,
          companyName: agent.company_name || "",
          commissionRate: agent.commission_rate || 0,
          totalEarnings: agent.total_earnings || 0,
          lastPayment: agent.last_payment || new Date().toISOString(),
        }));

        const clientInfos = rawClientInfos; // ClientInfo type already matches the database structure

        console.log('AcceptQuote - Transformed clients count:', clients.length);
        console.log('AcceptQuote - Client infos count:', clientInfos.length);

        // Step 5: Use mapQuoteData utility to properly convert to Quote type
        const mappedQuote = mapQuoteData(quoteData, clients, clientInfos);
        console.log('AcceptQuote - Mapped quote:', mappedQuote);
        setQuote(mappedQuote);

        // Step 6: Fetch client info if available
        if (quoteData.client_info_id) {
          console.log('AcceptQuote - Fetching client info for ID:', quoteData.client_info_id);
          const clientData = clientInfos.find(c => c.id === quoteData.client_info_id);
          if (clientData) {
            console.log('AcceptQuote - Client info loaded:', clientData);
            setClientInfo(clientData);
            setClientName(clientData.contact_name || "");
            setClientEmail(clientData.email || "");
          } else {
            console.log('AcceptQuote - No client info found for ID:', quoteData.client_info_id);
          }
        }

        // Step 7: Fetch template content if available
        if (quoteData.template_id) {
          console.log('AcceptQuote - Fetching template for ID:', quoteData.template_id);
          const { data: templateData, error: templateError } = await supabase
            .from('quote_templates')
            .select('content')
            .eq('id', quoteData.template_id)
            .maybeSingle();

          if (!templateError && templateData) {
            console.log('AcceptQuote - Template content loaded');
            setTemplateContent(templateData.content);
          } else if (templateError) {
            console.error('AcceptQuote - Error fetching template:', templateError);
          }
        }

        console.log('AcceptQuote - Quote loading completed successfully');
      } catch (error) {
        console.error('AcceptQuote - Unexpected error in fetchQuoteData:', error);
        setError(`Unexpected error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuoteData();
  }, [quoteId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAcceptQuote = async () => {
    if (!quote || !clientName.trim() || !clientEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive"
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if signature was provided
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some(channel => channel !== 0);

    if (!hasSignature) {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get signature as base64
      const signatureData = canvas.toDataURL();

      // Fetch the real client IP address
      const clientIp = await fetchClientIp();

      console.log('AcceptQuote - Submitting acceptance for quote:', quote.id);

      // Save acceptance to database
      const { error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .insert({
          quote_id: quote.id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          signature_data: signatureData,
          ip_address: clientIp,
          user_agent: navigator.userAgent
        });

      if (acceptanceError) {
        console.error('AcceptQuote - Error saving acceptance:', acceptanceError);
        throw new Error(`Failed to save acceptance: ${acceptanceError.message}`);
      }

      // Update quote status to approved and set acceptance details
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          status: 'approved',
          acceptance_status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: clientName.trim()
        })
        .eq('id', quote.id);

      if (quoteError) {
        console.error('AcceptQuote - Error updating quote status:', quoteError);
        throw new Error(`Failed to update quote status: ${quoteError.message}`);
      }

      // Call the edge function to handle order creation and circuit tracking
      try {
        const { data: orderResult, error: orderError } = await supabase.functions
          .invoke('handle-quote-approval', {
            body: { quoteId: quote.id }
          });

        if (orderError) {
          console.error('AcceptQuote - Error creating order:', orderError);
          // Don't fail the acceptance process if order creation fails
        } else {
          console.log('AcceptQuote - Order created successfully:', orderResult);
        }
      } catch (orderErr) {
        console.error('AcceptQuote - Order creation failed:', orderErr);
        // Continue with acceptance even if order creation fails
      }

      console.log('AcceptQuote - Quote acceptance completed successfully - status updated to approved');
      setIsAccepted(true);
      toast({
        title: "Agreement Accepted",
        description: "Thank you for accepting the agreement. We will be in touch soon!",
      });

    } catch (error: any) {
      console.error('AcceptQuote - Error accepting quote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept agreement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Quote ID: {quoteId}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Agreement Accepted</h1>
            <p className="text-gray-600">
              Thank you for accepting this agreement. We will be in touch with you soon to proceed with the next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
            <p className="text-gray-600">
              The requested quote could not be found or may have expired.
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mrcItems = quote.quoteItems?.filter(item => item.charge_type === 'MRC') || [];
  const nrcItems = quote.quoteItems?.filter(item => item.charge_type === 'NRC') || [];
  const mrcTotal = mrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  const nrcTotal = nrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Agreement</h1>
          <p className="text-gray-600">Please review the details below and accept the agreement</p>
        </div>

        <div className="grid gap-6">
          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Agreement Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Agreement Number</Label>
                  <p className="text-lg font-semibold">{quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                  <p className="text-lg">{new Date(quote.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company</Label>
                  <p className="text-lg">{clientInfo?.company_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Expires</Label>
                  <p className="text-lg">{quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              {quote.description && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-lg">{quote.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Service Details & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mrcItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Monthly Services</h3>
                  <div className="space-y-3">
                    {mrcItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.item?.name || item.name || 'Monthly Service'}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          {item.address && (
                            <p className="text-sm text-gray-500">
                              Location: {item.address.street_address}, {item.address.city}, {item.address.state} {item.address.zip_code}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number(item.total_price).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">per month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Monthly:</span>
                      <span className="text-lg font-bold text-green-600">${mrcTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {nrcItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">One-Time Setup Fees</h3>
                  <div className="space-y-3">
                    {nrcItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.item?.name || item.name || 'Setup Fee'}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number(item.total_price).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">one-time</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Setup Fees:</span>
                      <span className="text-lg font-bold text-blue-600">${nrcTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          {templateContent && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full border rounded-md p-4">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {templateContent}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Digital Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Digital Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Full Name</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email Address</Label>
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
                <Label>Signature</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Please sign in the box below using your mouse or touch device
                </p>
                <div className="border-2 border-gray-300 rounded-lg relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full h-48 cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="absolute top-2 right-2"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-center">
                <Button
                  onClick={handleAcceptQuote}
                  disabled={isSubmitting}
                  size="lg"
                  className="px-8"
                >
                  {isSubmitting ? "Accepting..." : "Accept Agreement"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AcceptQuote;
