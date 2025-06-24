
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuoteStatusBadgeProps {
  quoteId: string;
  status: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export const QuoteStatusBadge = ({ quoteId, status, onStatusUpdate }: QuoteStatusBadgeProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log(`Changing quote ${quoteId} status to ${newStatus}`);

      if (newStatus === 'pending') {
        // If changing to pending, we need to clear acceptance data
        const { error: acceptanceError } = await supabase
          .from('quote_acceptances')
          .delete()
          .eq('quote_id', quoteId);

        if (acceptanceError) {
          console.error('Error deleting acceptance records:', acceptanceError);
        }

        // Update quote with cleared acceptance fields
        const { error } = await supabase
          .from('quotes')
          .update({ 
            status: newStatus,
            accepted_at: null,
            accepted_by: null
          })
          .eq('id', quoteId);

        if (error) {
          console.error('Error updating quote status:', error);
          toast({
            title: "Failed to update status",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Status updated",
          description: `Quote status changed to ${newStatus}`,
        });

      } else if (newStatus === 'approved') {
        // For approval, first check if orders already exist
        const { data: existingOrders, error: orderCheckError } = await supabase
          .from('orders')
          .select('id')
          .eq('quote_id', quoteId);

        if (orderCheckError) {
          console.error('Error checking existing orders:', orderCheckError);
          toast({
            title: "Failed to approve quote",
            description: "Could not verify order status",
            variant: "destructive"
          });
          return;
        }

        if (existingOrders && existingOrders.length > 0) {
          console.log('Orders already exist for this quote, just updating status');
          
          // Just update the quote status since orders already exist
          const { error: updateError } = await supabase
            .from('quotes')
            .update({ 
              status: 'approved',
              accepted_at: new Date().toISOString()
            })
            .eq('id', quoteId);

          if (updateError) {
            console.error('Error updating quote status:', updateError);
            toast({
              title: "Failed to approve quote",
              description: updateError.message,
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "Quote approved successfully",
            description: "Quote status has been updated to approved.",
          });
        } else {
          // No existing orders, call the approval function to create them
          console.log('No existing orders found, calling fix-quote-approval function...');
          
          const { data: approvalResult, error: approvalError } = await supabase.functions
            .invoke('fix-quote-approval', {
              body: { quoteId: quoteId }
            });

          if (approvalError) {
            console.error('Error in quote approval function:', approvalError);
            toast({
              title: "Failed to approve quote",
              description: approvalError.message,
              variant: "destructive"
            });
            return;
          }

          console.log('Quote approval completed:', approvalResult);
          
          // Update the quote status to approved
          const { error: updateError } = await supabase
            .from('quotes')
            .update({ 
              status: 'approved',
              accepted_at: new Date().toISOString()
            })
            .eq('id', quoteId);

          if (updateError) {
            console.error('Error updating quote status after approval:', updateError);
            toast({
              title: "Warning",
              description: "Order was created but quote status update failed. Please refresh the page.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Quote approved successfully",
              description: "Quote status has been updated to approved and order has been created.",
            });
          }
        }

      } else if (newStatus === 'rejected') {
        // For rejection, just update the status
        const { error } = await supabase
          .from('quotes')
          .update({ status: newStatus })
          .eq('id', quoteId);

        if (error) {
          console.error('Error updating quote status:', error);
          toast({
            title: "Failed to update status",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Status updated",
          description: `Quote status changed to ${newStatus}`,
        });
      } else {
        // For other status changes, just update the status
        const { error } = await supabase
          .from('quotes')
          .update({ status: newStatus })
          .eq('id', quoteId);

        if (error) {
          console.error('Error updating quote status:', error);
          toast({
            title: "Failed to update status",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Status updated",
          description: `Quote status changed to ${newStatus}`,
        });
      }

      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }

      // Refresh the page to ensure all data is up to date
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Error updating quote status:', err);
      toast({
        title: "Error",
        description: "Failed to update quote status",
        variant: "destructive"
      });
    }
  };

  const statusColors = {
    approved: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    rejected: 'bg-red-50 text-red-700 border-red-200'
  };

  const badgeClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border-gray-200';

  if (isAdmin) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
            <Badge 
              variant="outline" 
              className={`text-xs cursor-pointer hover:opacity-80 flex items-center gap-1 ${badgeClass}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <ChevronDown className="w-3 h-3" />
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border shadow-md">
          <DropdownMenuItem 
            onClick={() => handleStatusChange('pending')}
            className="cursor-pointer hover:bg-gray-50"
          >
            Pending
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleStatusChange('approved')}
            className="cursor-pointer hover:bg-gray-50"
          >
            Approved
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleStatusChange('rejected')}
            className="cursor-pointer hover:bg-gray-50"
          >
            Rejected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${badgeClass}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
