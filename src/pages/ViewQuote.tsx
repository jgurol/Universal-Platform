import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Quote, ClientInfo } from "@/pages/Index";
import { NavigationBar } from "@/components/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";

const ViewQuote = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!quoteId) return;

      try {
        setIsLoading(true);
        
        // Fetch quote data
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (quoteError) {
          setError('Quote not found');
          return;
        }

        // Map the raw database data to the Quote interface
        const mappedQuote: Quote = {
          id: quoteData.id,
          clientId: quoteData.client_id || "",
          clientName: "Unknown Client", // Will be updated if client info is found
          companyName: "Unknown Company", // Will be updated if client info is found
          amount: Number(quoteData.amount) || 0,
          date: quoteData.date,
          description: quoteData.description || "",
          quoteNumber: quoteData.quote_number,
          quoteMonth: quoteData.quote_month,
          quoteYear: quoteData.quote_year,
          status: quoteData.status || "pending",
          commission: Number(quoteData.commission) || 0,
          clientInfoId: quoteData.client_info_id,
          commissionOverride: quoteData.commission_override ? Number(quoteData.commission_override) : undefined,
          expiresAt: quoteData.expires_at,
          notes: quoteData.notes,
          billingAddress: quoteData.billing_address,
          serviceAddress: quoteData.service_address,
          templateId: quoteData.template_id,
          acceptanceStatus: quoteData.acceptance_status as 'pending' | 'accepted' | 'declined',
          acceptedAt: quoteData.accepted_at,
          acceptedBy: quoteData.accepted_by,
          email_status: quoteData.email_status as 'idle' | 'success' | 'error'
        };

        setQuote(mappedQuote);

        // Fetch client info if available
        if (quoteData.client_info_id) {
          const { data: clientData } = await supabase
            .from('client_info')
            .select('*')
            .eq('id', quoteData.client_info_id)
            .single();

          if (clientData) {
            setClientInfo(clientData as ClientInfo);
            // Update quote with client info
            setQuote(prev => prev ? {
              ...prev,
              clientName: clientData.contact_name || clientData.company_name || "Unknown Client",
              companyName: clientData.company_name || "Unknown Company"
            } : null);
          }
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError('Failed to load quote');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuoteData();
  }, [quoteId]);

  const handleViewPDF = async () => {
    if (!quote) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdf = await generateQuotePDF(quote, clientInfo);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading quote...</div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Quote Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={handleViewPDF}
              disabled={isGeneratingPDF}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "View PDF"}
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quote {quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}
          </h1>
          <p className="text-gray-600">Quote details and information</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quote Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Client</label>
                <p className="text-lg">{quote.clientName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-lg">{quote.companyName || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-lg">{quote.description || 'No description'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg capitalize">{quote.status || 'Pending'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="text-lg">{new Date(quote.date).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-lg font-mono">${quote.amount?.toLocaleString() || '0'}</p>
              </div>
            </div>
            
            {quote.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {clientInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="text-lg">{clientInfo.contact_name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{clientInfo.email || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{clientInfo.phone || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg">{clientInfo.address || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewQuote;
