
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Eye, Download } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface QuoteAcceptance {
  id: string;
  client_name: string;
  client_email: string;
  signature_data: string;
  accepted_at: string;
  ip_address: string;
  user_agent: string;
}

export const OrdersManagement = () => {
  const { orders, isLoading, deleteOrder } = useOrders();
  const { toast } = useToast();
  const [quoteAcceptances, setQuoteAcceptances] = useState<Record<string, QuoteAcceptance>>({});
  const [selectedAgreement, setSelectedAgreement] = useState<QuoteAcceptance | null>(null);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);

  // Fetch quote acceptances for orders
  useEffect(() => {
    const fetchQuoteAcceptances = async () => {
      if (orders.length === 0) return;

      const quoteIds = orders.map(order => order.quote_id);
      
      try {
        const { data, error } = await supabase
          .from('quote_acceptances')
          .select('*')
          .in('quote_id', quoteIds);

        if (error) {
          console.error('Error fetching quote acceptances:', error);
          return;
        }

        // Create a map of quote_id to acceptance data
        const acceptancesMap: Record<string, QuoteAcceptance> = {};
        data?.forEach(acceptance => {
          acceptancesMap[acceptance.quote_id] = acceptance;
        });

        setQuoteAcceptances(acceptancesMap);
      } catch (error) {
        console.error('Error fetching quote acceptances:', error);
      }
    };

    fetchQuoteAcceptances();
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

  const handleViewAgreement = (quoteId: string) => {
    const acceptance = quoteAcceptances[quoteId];
    if (acceptance) {
      setSelectedAgreement(acceptance);
      setAgreementDialogOpen(true);
    }
  };

  const handleDownloadSignature = (acceptance: QuoteAcceptance) => {
    try {
      const link = document.createElement('a');
      link.href = acceptance.signature_data;
      link.download = `signature-${acceptance.client_name}-${new Date(acceptance.accepted_at).toDateString()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Signature downloaded",
        description: "The signature has been downloaded to your device.",
      });
    } catch (error) {
      console.error('Error downloading signature:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the signature. Please try again.",
        variant: "destructive",
      });
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

      {/* Agreement Viewer Dialog */}
      <Dialog open={agreementDialogOpen} onOpenChange={setAgreementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Signed Agreement</DialogTitle>
            <DialogDescription>
              Agreement details and digital signature
            </DialogDescription>
          </DialogHeader>
          {selectedAgreement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Client Name</h4>
                  <p className="text-lg">{selectedAgreement.client_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="text-lg">{selectedAgreement.client_email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Signed Date</h4>
                  <p className="text-lg">{formatDateForDisplay(selectedAgreement.accepted_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">IP Address</h4>
                  <p className="text-lg font-mono text-sm">{selectedAgreement.ip_address}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Digital Signature</h4>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img 
                    src={selectedAgreement.signature_data} 
                    alt="Digital Signature" 
                    className="max-w-full h-auto border border-gray-200 rounded bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadSignature(selectedAgreement)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Signature
                  </Button>
                </div>
              </div>
              
              {selectedAgreement.user_agent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Device Information</h4>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    {selectedAgreement.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
