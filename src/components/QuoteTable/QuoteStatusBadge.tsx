
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
        console.log('Clearing acceptance data for quote being set to pending');
        
        // Delete acceptance records from quote_acceptances table
        const { error: acceptanceError } = await supabase
          .from('quote_acceptances')
          .delete()
          .eq('quote_id', quoteId);

        if (acceptanceError) {
          console.error('Error deleting acceptance records:', acceptanceError);
          // Don't fail the whole operation if this fails, but log it
        } else {
          console.log('Successfully deleted acceptance records for quote:', quoteId);
        }

        // Update quote with cleared acceptance fields and pending status
        const { error } = await supabase
          .from('quotes')
          .update({ 
            status: newStatus,
            accepted_at: null,
            accepted_by: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', quoteId);

        if (error) {
          console.error('Error updating quote status to pending:', error);
          toast({
            title: "Failed to update status",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        console.log('Successfully updated quote to pending and cleared acceptance data');
        toast({
          title: "Status updated",
          description: "Quote status changed to pending and acceptance data cleared",
        });

      } else if (newStatus === 'approved') {
        // For approval, always use the status-only update to avoid order creation issues
        console.log('Approving quote via status-only update');
        
        const { data: approvalResult, error: approvalError } = await supabase.functions
          .invoke('fix-quote-approval', {
            body: { 
              quoteId: quoteId,
              action: 'update_status_only'
            }
          });

        if (approvalError) {
          console.error('Error in quote approval:', approvalError);
          toast({
            title: "Failed to approve quote",
            description: "There was an error approving the quote. Please try again.",
            variant: "destructive"
          });
          return;
        }

        console.log('Quote approval completed:', approvalResult);
        
        if (approvalResult?.success) {
          toast({
            title: "Quote approved successfully",
            description: "Quote status has been updated to approved.",
          });
        } else {
          toast({
            title: "Approval may have failed",
            description: approvalResult?.error || "Please refresh the page to see current status.",
            variant: "destructive"
          });
        }

      } else if (newStatus === 'rejected') {
        // For rejection, just update the status
        const { error } = await supabase
          .from('quotes')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
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
      } else {
        // For other status changes, just update the status
        const { error } = await supabase
          .from('quotes')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
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
      }

      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }

      // Refresh after a short delay to show updated status
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
