import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Eye, Package, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ClientInfo } from "@/types/index";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAgentMapping } from "@/hooks/useAgentMapping";
import { generateQuotePDF } from "@/utils/pdf";
import { Quote } from "@/types/index";
import { useOrders } from "@/hooks/useOrders";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Helper function to format dates
const formatDateForDisplay = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

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
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: "",
    notes: "",
    billing_address: "",
    service_address: ""
  });
  const [quoteAcceptances, setQuoteAcceptances] = useState<Record<string, QuoteAcceptance>>({});
  const [quotesData, setQuotesData] = useState<Record<string, any>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
  const [newOrder, setNewOrder] = useState({
    company_name: '',
    notes: '',
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { agentMapping } = useAgentMapping();

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

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

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quote_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status,
      notes: order.notes || "",
      billing_address: order.billing_address || "",
      service_address: order.service_address || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: editFormData.status,
          notes: editFormData.notes,
          billing_address: editFormData.billing_address,
          service_address: editFormData.service_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Order updated",
        description: "Order has been updated successfully.",
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast({
        title: "Order deleted",
        description: "Order has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive"
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
        notes: clientInfoData.notes,
        revio_id: clientInfoData.revio_id,
        agent_id: clientInfoData.agent_id,
        created_at: clientInfoData.created_at,
        updated_at: clientInfoData.updated_at,
        commission_override: clientInfoData.commission_override
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

  const mockClientInfo: ClientInfo = {
    id: "mock-id",
    company_name: "Mock Company",
    notes: null,
    revio_id: null,
    agent_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: user?.id || "",
    commission_override: null
  };

  const handleCreateOrder = async () => {
    if (!newOrder.company_name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create client info first
      const clientInfoData = {
        company_name: newOrder.company_name,
        notes: newOrder.notes || '',
        user_id: user?.id || ''
      };

      const { error: clientError } = await supabase
        .from('client_info')
        .insert(clientInfoData);

      if (clientError) throw clientError;

      toast({
        title: "Success",
        description: "Order created successfully",
      });

      // Reset form and close dialog
      setNewOrder({
        company_name: '',
        notes: '',
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">Manage and track your orders</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote Number</TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Account Manager</TableHead>
                    <TableHead>Accepted by</TableHead>
                    <TableHead>Accepted Date</TableHead>
                    <TableHead>Agreement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const acceptance = quoteAcceptances[order.quote_id];
                    const quoteData = quotesData[order.quote_id];
                    const agentId = quoteData?.client_info?.agent_id;
                    const accountManager = agentId ? agentMapping[agentId] || 'Unknown' : 'No Agent';
                    const isGenerating = isGeneratingPdf === order.quote_id;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {quoteData?.quote_number || `Q-${order.quote_id.slice(0, 8)}`}
                        </TableCell>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this order? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Order
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update order details and status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editFormData.status} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_address">Billing Address</Label>
              <Textarea
                id="billing_address"
                value={editFormData.billing_address}
                onChange={(e) => setEditFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                placeholder="Enter billing address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_address">Service Address</Label>
              <Textarea
                id="service_address"
                value={editFormData.service_address}
                onChange={(e) => setEditFormData(prev => ({ ...prev, service_address: e.target.value }))}
                placeholder="Enter service address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this order"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateOrder}>
                Update Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
            <DialogDescription>
              Add a new order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={newOrder.company_name}
                onChange={(e) => setNewOrder(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newOrder.notes}
                onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this order"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder}>
                Create Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Order Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">Order #{order.order_number}</p>
                  </div>
                </TableCell>
                <TableCell>{order.notes}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
                <TableCell>$0.00</TableCell>
                <TableCell>$0.00</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersManagement;
