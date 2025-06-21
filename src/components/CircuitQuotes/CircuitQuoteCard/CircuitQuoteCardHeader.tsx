
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Edit, Trash2, FileText } from "lucide-react";
import { CircuitQuoteStatusSelect } from "@/components/CircuitQuoteStatusSelect";
import { EditCircuitQuoteDialog } from "@/components/EditCircuitQuoteDialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes";
import { DealRegistration } from "@/services/dealRegistrationService";

interface CircuitQuoteCardHeaderProps {
  quote: CircuitQuote & {
    client?: string;
    creationDate?: string;
  };
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: string) => void;
  onDeleteQuote: () => void;
  onUpdateQuote?: (quote: CircuitQuote) => void;
}

// Deal Details Dialog Component
const DealDetailsDialog = ({ open, onOpenChange, deal }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  deal: DealRegistration | null; 
}) => {
  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deal Details</DialogTitle>
          <DialogDescription>
            Information about the associated deal registration
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Deal Name</Label>
              <p className="text-sm font-medium">{deal.deal_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Deal Value</Label>
              <p className="text-sm font-medium">${deal.deal_value.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Stage</Label>
              <p className="text-sm capitalize">{deal.stage.replace('-', ' ')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Probability</Label>
              <p className="text-sm">{deal.probability}%</p>
            </div>
          </div>
          
          {deal.expected_close_date && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Expected Close Date</Label>
              <p className="text-sm">{new Date(deal.expected_close_date).toLocaleDateString()}</p>
            </div>
          )}
          
          {deal.description && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Description</Label>
              <p className="text-sm">{deal.description}</p>
            </div>
          )}
          
          {deal.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Notes</Label>
              <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CircuitQuoteCardHeader = ({ 
  quote, 
  isExpanded, 
  onToggleExpanded, 
  onStatusChange,
  onDeleteQuote,
  onUpdateQuote
}: CircuitQuoteCardHeaderProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDealDetailsOpen, setIsDealDetailsOpen] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('Loading...');
  const [associatedDeal, setAssociatedDeal] = useState<DealRegistration | null>(null);
  const { isAdmin, user } = useAuth();

  // Fetch the creator's name from the profiles table
  useEffect(() => {
    const fetchCreatorName = async () => {
      // For circuit quotes, we need to get the user_id from the quote
      const userId = (quote as any).user_id || user?.id;
      
      if (!userId) {
        setCreatorName('Unknown User');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching creator profile:', error);
          setCreatorName('Unknown User');
          return;
        }
        
        if (profile?.full_name && profile.full_name.trim() !== '') {
          setCreatorName(profile.full_name);
        } else if (profile?.email) {
          setCreatorName(profile.email);
        } else {
          setCreatorName('Unknown User');
        }
      } catch (error) {
        console.error('Error fetching creator name:', error);
        setCreatorName('Unknown User');
      }
    };

    fetchCreatorName();
  }, [quote, user]);

  // Fetch associated deal details if deal_registration_id exists
  useEffect(() => {
    const fetchAssociatedDeal = async () => {
      if (!quote.deal_registration_id) {
        setAssociatedDeal(null);
        return;
      }

      try {
        const { data: deal, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('id', quote.deal_registration_id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching associated deal:', error);
          setAssociatedDeal(null);
          return;
        }

        setAssociatedDeal(deal);
      } catch (error) {
        console.error('Error fetching associated deal:', error);
        setAssociatedDeal(null);
      }
    };

    fetchAssociatedDeal();
  }, [quote.deal_registration_id]);

  const handleEditQuote = () => {
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuote = (updatedQuote: CircuitQuote) => {
    if (onUpdateQuote) {
      onUpdateQuote(updatedQuote);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new_pricing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'researching':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'sent_to_customer':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'new_pricing':
        return 'New Pricing';
      case 'researching':
        return 'Researching';
      case 'completed':
        return 'Completed';
      case 'sent_to_customer':
        return 'Sent to Customer';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Show delete button for admins or if the quote is in "new_pricing" status
  const canDelete = isAdmin || quote.status === 'new_pricing';

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="p-1"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          
          <div>
            <h3 className="font-semibold text-lg">{quote.client_name}</h3>
            <p className="text-sm text-gray-600">
              {quote.location}
              {quote.suite && ` - Suite ${quote.suite}`}
            </p>
            <p className="text-xs text-gray-500">
              Created: {quote.created_at} • Created by: {creatorName}
            </p>
            
            {/* Display Associated Deal */}
            {associatedDeal && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-gray-700">Deal:</span>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-800 border-green-200">
                  {associatedDeal.deal_name}
                </Badge>
              </div>
            )}
            
            {/* Display Circuit Categories */}
            {quote.categories && quote.categories.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-gray-700">Categories:</span>
                <div className="flex flex-wrap gap-1">
                  {quote.categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800 capitalize">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quote Requirements Badges */}
          {(quote.static_ip || quote.slash_29 || quote.dhcp || quote.mikrotik_required) && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Requirement:</span>
              <div className="flex flex-wrap gap-1">
                {quote.static_ip && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    /30 IP
                  </Badge>
                )}
                {quote.slash_29 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    /29 IP
                  </Badge>
                )}
                {quote.dhcp && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    DHCP
                  </Badge>
                )}
                {quote.mikrotik_required && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    Mikrotik
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Status - Dropdown for admins, Badge for agents */}
          {isAdmin ? (
            <CircuitQuoteStatusSelect
              status={quote.status}
              onStatusChange={onStatusChange}
            />
          ) : (
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusBadgeColor(quote.status)}`}
            >
              {formatStatusLabel(quote.status)}
            </Badge>
          )}
          
          {/* Deal Details Button - Show if there's an associated deal */}
          {associatedDeal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDealDetailsOpen(true)}
              className="h-8 w-8 p-0"
              title="View Deal Details"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          
          {/* Action buttons - Edit for admins, Delete conditionally */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditQuote}
              className="h-8 w-8 p-0"
              title="Edit Quote"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteQuote}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Delete Quote"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isAdmin && onUpdateQuote && (
        <EditCircuitQuoteDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          quote={quote}
          onUpdateQuote={handleUpdateQuote}
        />
      )}

      <DealDetailsDialog
        open={isDealDetailsOpen}
        onOpenChange={setIsDealDetailsOpen}
        deal={associatedDeal}
      />
    </>
  );
};
