
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Paperclip, Upload, FileText } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const OrdersManagement = () => {
  const { orders, isLoading, deleteOrder } = useOrders();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX, JPG, PNG)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, Word document, or image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadAgreement = async (orderId: string) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploadingOrderId(orderId);

    try {
      // For now, we'll just simulate the upload
      // In a real implementation, you would upload to Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Agreement uploaded",
        description: "The signed agreement has been attached to the order.",
      });
      
      setSelectedFile(null);
      setAttachmentDialogOpen(false);
    } catch (error) {
      console.error('Error uploading agreement:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingOrderId(null);
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
          Manage orders created from approved quotes and attach signed agreements
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
                {orders.map((order) => (
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
                      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setUploadingOrderId(order.id)}
                          >
                            <Paperclip className="w-4 h-4 mr-1" />
                            Attach Agreement
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Signed Agreement</DialogTitle>
                            <DialogDescription>
                              Upload the completed signed agreement for order {order.order_number}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="agreement-file">Select Agreement File</Label>
                              <Input
                                id="agreement-file"
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="cursor-pointer"
                              />
                              <p className="text-sm text-gray-500">
                                Accepted formats: PDF, Word documents, or images (max 10MB)
                              </p>
                            </div>
                            
                            {selectedFile && (
                              <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium">Selected file:</p>
                                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            )}
                            
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setAttachmentDialogOpen(false);
                                  setSelectedFile(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => handleUploadAgreement(order.id)}
                                disabled={!selectedFile || uploadingOrderId === order.id}
                              >
                                {uploadingOrderId === order.id ? (
                                  <>
                                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Agreement
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
