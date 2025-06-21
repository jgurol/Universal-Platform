import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { CircuitQuoteStatusSelect } from "@/components/CircuitQuoteStatusSelect";
import { EditCircuitQuoteDialog } from "@/components/EditCircuitQuoteDialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes";

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

export const CircuitQuoteCardHeader = ({ 
  quote, 
  isExpanded, 
  onToggleExpanded, 
  onStatusChange,
  onDeleteQuote,
  onUpdateQuote
}: CircuitQuoteCardHeaderProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('Loading...');
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
          {(quote.static_ip || quote.slash_29 || quote.mikrotik_required) && (
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
          
          {/* Action buttons - only visible to admins */}
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditQuote}
                className="h-8 w-8 p-0"
                title="Edit Quote"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteQuote}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Delete Quote"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
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
    </>
  );
};
