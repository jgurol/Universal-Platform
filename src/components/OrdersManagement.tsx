
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Eye } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [quoteAcceptances, setQuoteAcceptances] = useState<Record<string, QuoteAcceptance>>({});
  const [selectedAgreement, setSelectedAgreement] = useState<QuoteAcceptance | null>(null);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch quote acceptances for orders
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

    setSelectedAgreement(acceptance);
    setIsGeneratingPdf(true);
    setAgreementDialogOpen(true);

    try {
      // Fetch the full quote data to generate PDF
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

      // Transform the data to match Quote interface
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
        notes: quoteData.notes || ''
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

      // Generate PDF using the same function as quotes tab
      const pdf = await generateQuotePDF(quote, clientInfo, acceptance.client_name);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate agreement PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Clean up PDF URL when dialog closes
  useEffect(() => {
    if (!agreementDialogOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [agreementDialogOpen, pdfUrl]);

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
    <>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Agreement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const acceptance = quoteAcceptances[order.quote_id];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.order_number}
                        </TableCell>
                        <TableCell className="font-mono">
                          ${order.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              order.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateForDisplay(order.created_at)}
                        </TableCell>
                        <TableCell>
                          {acceptance ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleViewAgreement(order.quote_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Agreement
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

      {/* PDF Agreement Viewer Dialog */}
      <Dialog open={agreementDialogOpen} onOpenChange={setAgreementDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Signed Agreement</DialogTitle>
            <DialogDescription>
              View the complete signed agreement document
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            {isGeneratingPdf ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating agreement PDF...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-96 border border-gray-200 rounded"
                title="Signed Agreement PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <p>Unable to load agreement PDF</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
