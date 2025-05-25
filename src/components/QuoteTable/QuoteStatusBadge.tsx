
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
      }

      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }

      // Show different messages based on status change
      let description = `Quote status changed to ${newStatus}`;
      if (newStatus === 'approved') {
        description += '. An order has been automatically created and circuit tracking initiated if applicable.';
      } else if (newStatus === 'pending') {
        description += ' and digital signature evidence removed';
      }

      toast({
        title: "Status updated",
        description: description,
      });
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
