
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Eye } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { useAgentMapping } from "@/hooks/useAgentMapping";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";
import { generateQuotePDF } from "@/utils/pdf";
import { Quote, ClientInfo } from "@/pages/Index";

interface QuoteAcceptance {
  id: string;
  client_name: string;
  client_email: string;
  signature_data: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string;
}

export const OrdersManagement = () => {
  const { orders, isLoading, deleteOrder } = useOrders();
  const { toast } = useToast();
  const { agentMapping } = useAgentMapping();
  const [quoteAcceptances, setQuoteAcceptances] = useState<Record<string, QuoteAcceptance>>({});
  const [quotesData, setQuotesData] = useState<Record<string, any>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  // Fetch quote data and acceptances for orders
  useEffect(() => {
    const fetchQuoteData = async () => {
      if (orders.length === 0) return;

      const quoteIds = orders.map(order => order.quote_id);
      
      try {
        // Fetch quote acceptances
        const { data: acceptanceData, error: acceptanceError } = await supabase
          .from('quote_acceptances')
          .select('*')
          .in('quote_id', quoteIds);

        if (acceptanceError) {
          console.error('Error fetching quote acceptances:', acceptanceError);
        } else if (acceptanceData) {
          // Create a map of quote_id to acceptance data
          const acceptancesMap: Record<string, QuoteAcceptance> = {};
          acceptanceData.forEach(acceptance => {
            acceptancesMap[acceptance.quote_id] = {
              ...acceptance,
              ip_address: acceptance.ip_address?.toString() || null
            };
          });
          setQuoteAcceptances(acceptancesMap);
        }

        // Fetch quote data to get client_info_id for account manager lookup
        const { data: quotesQueryData, error: quotesError } = await supabase
          .from('quotes')
          .select(`
            id,
            client_info_id,
            template_id,
            *,
            client_info (
              agent_id
            )
          `)
          .in('id', quoteIds);

        if (quotesError) {
          console.error('Error fetching quotes data:', quotesError);
        } else if (quotesQueryData) {
          const quotesMap: Record<string, any> = {};
          quotesQueryData.forEach(quote => {
            quotesMap[quote.id] = quote;
          });
          setQuotesData(quotesMap);
        }
      } catch (error) {
        console.error('Error fetching quote data:', error);
      }
    };

    fetchQuoteData();
  }, [orders]);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast({
        title: "Order deleted",
        description: "The order has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewAgreement = async (quoteId: string) => {
    const acceptance = quoteAcceptances[quoteId];
    if (!acceptance) return;

    setIsGeneratingPdf(quoteId);

    try {
      // Fetch the full quote data including template_id
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            item_id,
            quantity,
            unit_price,
            total_price,
            charge_type,
            address_id,
            items (
              id,
              name,
              description,
              sku,
              price
            ),
            client_addresses (
              id,
              street_address,
              city,
              state,
              zip_code
            )
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Fetch client info
      const { data: clientInfoData } = await supabase
        .from('client_info')
        .select('*')
        .eq('id', quoteData.client_info_id)
        .single();

      // Get the account manager name for the PDF
      const agentId = clientInfoData?.agent_id;
      const accountManagerName = agentId ? agentMapping[agentId] || 'Unknown' : 'No Agent';

      // Transform the data to match Quote interface, including templateId
      const quote: Quote = {
        id: quoteData.id,
        clientId: quoteData.client_id || '',
        clientName: acceptance.client_name,
        companyName: acceptance.client_name,
        amount: quoteData.amount || 0,
        date: quoteData.created_at || '',
        description: quoteData.description || '',
        quoteNumber: quoteData.quote_number || '',
        status: 'approved', // Since this is an accepted quote
        clientInfoId: quoteData.client_info_id || '',
        quoteItems: quoteData.quote_items?.map((item: any) => ({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          charge_type: item.charge_type,
          address_id: item.address_id,
          name: item.items?.name || '',
          description: item.items?.description || '',
          item: item.items,
          address: item.client_addresses
        })) || [],
        billingAddress: quoteData.billing_address || '',
        serviceAddress: quoteData.service_address || '',
        expiresAt: quoteData.expires_at || '',
        notes: quoteData.notes || '',
        templateId: quoteData.template_id || undefined // Include template ID
      };

      const clientInfo: ClientInfo | undefined = clientInfoData ? {
        id: clientInfoData.id,
        user_id: clientInfoData.user_id,
        company_name: clientInfoData.company_name,
        contact_name: clientInfoData.contact_name,
        email: clientInfoData.email,
        phone: clientInfoData.phone,
        address: clientInfoData.address,
        notes: clientInfoData.notes,
        revio_id: clientInfoData.revio_id,
        agent_id: clientInfoData.agent_id,
        created_at: clientInfoData.created_at,
        updated_at: clientInfoData.updated_at
      } : undefined;

      // Generate PDF using the same function as quotes tab, but pass the correct account manager name
      const pdf = await generateQuotePDF(quote, clientInfo, accountManagerName);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new window
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to view the agreement.",
          variant: "destructive",
        });
      }
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate agreement PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <CardDescription>Loading orders...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders Management</CardTitle>
        <CardDescription>
          Manage orders created from approved quotes and view signed agreements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found</p>
            <p className="text-sm">Orders will appear here when quotes are approved</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Account Manager</TableHead>
                  <TableHead>Accepted by</TableHead>
                  <TableHead>Accepted Date</TableHead>
                  <TableHead>Agreement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const acceptance = quoteAcceptances[order.quote_id];
                  const quoteData = quotesData[order.quote_id];
                  const agentId = quoteData?.client_info?.agent_id;
                  const accountManager = agentId ? agentMapping[agentId] || 'Unknown' : 'No Agent';
                  const isGenerating = isGeneratingPdf === order.quote_id;
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        {accountManager}
                      </TableCell>
                      <TableCell>
                        {acceptance ? acceptance.client_name : 'Not Available'}
                      </TableCell>
                      <TableCell>
                        {acceptance ? formatDateForDisplay(acceptance.accepted_at) : 'Not Available'}
                      </TableCell>
                      <TableCell>
                        {acceptance ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleViewAgreement(order.quote_id)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                View Agreement
                              </>
                            )}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            No Agreement
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
