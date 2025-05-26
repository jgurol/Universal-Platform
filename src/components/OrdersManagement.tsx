
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
import { QuoteItemData } from "@/types/quoteItems";

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
  const [quoteItems, setQuoteItems] = useState<Record<string, QuoteItemData[]>>({});
  const [selectedAgreement, setSelectedAgreement] = useState<QuoteAcceptance | null>(null);
  const [selectedQuoteItems, setSelectedQuoteItems] = useState<QuoteItemData[]>([]);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);

  // Fetch quote acceptances and quote items for orders
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

        // Fetch quote items for each quote
        const { data: itemsData, error: itemsError } = await supabase
          .from('quote_items')
          .select(`
            *,
            item:items(*),
            address:client_addresses(*)
          `)
          .in('quote_id', quoteIds);

        if (itemsError) {
          console.error('Error fetching quote items:', itemsError);
        } else if (itemsData) {
          // Group items by quote_id
          const itemsMap: Record<string, QuoteItemData[]> = {};
          itemsData.forEach(item => {
            if (!itemsMap[item.quote_id]) {
              itemsMap[item.quote_id] = [];
            }
            itemsMap[item.quote_id].push({
              id: item.id,
              item_id: item.item_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              charge_type: item.charge_type as 'NRC' | 'MRC',
              address_id: item.address_id,
              name: item.item?.name || '',
              description: item.item?.description || '',
              item: item.item,
              address: item.address
            });
          });
          setQuoteItems(itemsMap);
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

  const handleViewAgreement = (quoteId: string) => {
    const acceptance = quoteAcceptances[quoteId];
    const items = quoteItems[quoteId] || [];
    if (acceptance) {
      setSelectedAgreement(acceptance);
      setSelectedQuoteItems(items);
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

  const getMRCTotal = (items: QuoteItemData[]) => {
    return items
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + item.total_price, 0);
  };

  const getNRCTotal = (items: QuoteItemData[]) => {
    return items
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + item.total_price, 0);
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

      {/* Agreement Viewer Dialog - PDF Style */}
      <Dialog open={agreementDialogOpen} onOpenChange={setAgreementDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-normal text-gray-600">Service Agreement</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Digitally signed agreement and order details
                </DialogDescription>
              </div>
              <div className="bg-green-100 px-3 py-1 rounded">
                <span className="text-green-800 font-medium text-sm">APPROVED</span>
              </div>
            </div>
          </DialogHeader>
          
          {selectedAgreement && (
            <div className="space-y-6 pt-4">
              {/* Agreement Details Box - PDF Style */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Agreement:</span>
                      <div className="text-sm text-gray-900 mt-1">Service Agreement v2</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <div className="text-sm text-gray-900 mt-1">{formatDateForDisplay(selectedAgreement.accepted_at)}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Client:</span>
                      <div className="text-sm text-gray-900 mt-1">{selectedAgreement.client_name}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email:</span>
                      <div className="text-sm text-gray-900 mt-1">{selectedAgreement.client_email}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Items Section - PDF Style */}
              {selectedQuoteItems.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Service Agreement Items</h3>
                  
                  {/* Monthly Fees Section */}
                  {selectedQuoteItems.filter(item => item.charge_type === 'MRC').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-blue-700">Monthly Fees</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                            <div className="col-span-5">Description</div>
                            <div className="col-span-1 text-center">Qty</div>
                            <div className="col-span-2 text-right">Price</div>
                            <div className="col-span-2 text-right">Total</div>
                            <div className="col-span-2"></div>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {selectedQuoteItems
                            .filter(item => item.charge_type === 'MRC')
                            .map((item, index) => (
                              <div key={item.id} className={`px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                <div className="grid grid-cols-12 gap-2 items-start">
                                  <div className="col-span-5">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    {item.address && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Location: {item.address.street_address}, {item.address.city}, {item.address.state} {item.address.zip_code}
                                      </div>
                                    )}
                                  </div>
                                  <div className="col-span-1 text-center text-sm">{item.quantity}</div>
                                  <div className="col-span-2 text-right text-sm">${item.unit_price.toFixed(2)}</div>
                                  <div className="col-span-2 text-right text-sm font-medium">${item.total_price.toFixed(2)}</div>
                                  <div className="col-span-2"></div>
                                </div>
                              </div>
                            ))}
                        </div>
                        <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                          <div className="flex justify-end">
                            <div className="text-sm font-bold">
                              Total Monthly: ${getMRCTotal(selectedQuoteItems).toFixed(2)} USD
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* One-Time Fees Section */}
                  {selectedQuoteItems.filter(item => item.charge_type === 'NRC').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-green-700">One-Time Setup Fees</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                            <div className="col-span-5">Description</div>
                            <div className="col-span-1 text-center">Qty</div>
                            <div className="col-span-2 text-right">Price</div>
                            <div className="col-span-2 text-right">Total</div>
                            <div className="col-span-2"></div>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {selectedQuoteItems
                            .filter(item => item.charge_type === 'NRC')
                            .map((item, index) => (
                              <div key={item.id} className={`px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                <div className="grid grid-cols-12 gap-2 items-start">
                                  <div className="col-span-5">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    {item.address && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Location: {item.address.street_address}, {item.address.city}, {item.address.state} {item.address.zip_code}
                                      </div>
                                    )}
                                  </div>
                                  <div className="col-span-1 text-center text-sm">{item.quantity}</div>
                                  <div className="col-span-2 text-right text-sm">${item.unit_price.toFixed(2)}</div>
                                  <div className="col-span-2 text-right text-sm font-medium">${item.total_price.toFixed(2)}</div>
                                  <div className="col-span-2"></div>
                                </div>
                              </div>
                            ))}
                        </div>
                        <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                          <div className="flex justify-end">
                            <div className="text-sm font-bold">
                              One-Time Setup Fees: ${getNRCTotal(selectedQuoteItems).toFixed(2)} USD
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grand Total Section */}
                  <div className="border-t pt-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">Grand Total:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${(getMRCTotal(selectedQuoteItems) + getNRCTotal(selectedQuoteItems)).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Digital Signature Section - PDF Style */}
              <div className="space-y-4 border-t pt-6">
                <h4 className="text-md font-medium text-gray-900">Digital Acceptance Evidence</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Accepted by:</span>
                        <div className="text-gray-900 mt-1">{selectedAgreement.client_name}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date & Time:</span>
                        <div className="text-gray-900 mt-1">{new Date(selectedAgreement.accepted_at).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">IP Address:</span>
                        <div className="text-gray-900 mt-1 font-mono text-xs">{selectedAgreement.ip_address || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <div className="text-gray-900 mt-1">{selectedAgreement.client_email}</div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <span className="font-medium text-gray-700 text-sm">Digital Signature:</span>
                      <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg">
                        <img 
                          src={selectedAgreement.signature_data} 
                          alt="Digital Signature" 
                          className="max-w-full h-auto max-h-32 border border-gray-100 rounded bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 flex justify-end">
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
                </div>
              </div>
              
              {/* Device Information */}
              {selectedAgreement.user_agent && (
                <div className="border-t pt-4">
                  <span className="font-medium text-gray-700 text-sm">Device Information:</span>
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 font-mono">
                    {selectedAgreement.user_agent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
