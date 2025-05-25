
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
      // If changing to pending, we need to clear acceptance data
      if (newStatus === 'pending') {
        // Delete any acceptance records
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
            acceptance_status: 'pending',
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
      } else if (newStatus === 'approved') {
        // For approval, first update the quote status
        const { error: quoteUpdateError } = await supabase
          .from('quotes')
          .update({ status: newStatus })
          .eq('id', quoteId);

        if (quoteUpdateError) {
          console.error('Error updating quote status:', quoteUpdateError);
          toast({
            title: "Failed to update status",
            description: quoteUpdateError.message,
            variant: "destructive"
          });
          return;
        }

        // Then try to create orders, but handle gracefully if they already exist
        try {
          const { data: orderResult, error: orderError } = await supabase.functions
            .invoke('fix-quote-approval', {
              body: { quoteId: quoteId }
            });

          if (orderError) {
            console.error('Error in order creation:', orderError);
            // Don't fail the status update if order creation fails
            toast({
              title: "Status updated",
              description: "Quote approved but there was an issue creating orders. Orders may already exist.",
              variant: "default"
            });
          } else {
            console.log('Order creation result:', orderResult);
            toast({
              title: "Status updated",
              description: `Quote approved and ${orderResult.ordersCount || 0} order(s) created.`,
            });
          }
        } catch (orderErr) {
          console.error('Order creation failed:', orderErr);
          // Still show success for status update
          toast({
            title: "Status updated",
            description: "Quote approved. Orders may already exist for this quote.",
          });
        }
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
