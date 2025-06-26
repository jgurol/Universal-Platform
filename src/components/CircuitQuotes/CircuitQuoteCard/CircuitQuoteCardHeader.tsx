
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircuitQuoteStatusSelect } from "@/components/CircuitQuoteStatusSelect";
import { EditCircuitQuoteDialog } from "@/components/EditCircuitQuoteDialog";
import { CircuitQuoteNotesDialog } from "@/components/CircuitQuotes/CircuitQuoteNotesDialog";
import { DealDetailsDialog } from "@/components/CircuitQuotes/DealDetailsDialog";
import { ChevronDown, ChevronUp, Edit, Trash2, FileText, MapPin, Building, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
  onUpdateQuote: (quote: CircuitQuote) => void;
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
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isDealDetailsOpen, setIsDealDetailsOpen] = useState(false);
  const { isAdmin } = useAuth();

  const statusColors = {
    'new_pricing': 'bg-blue-100 text-blue-800',
    'researching': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'sent_to_customer': 'bg-purple-100 text-purple-800'
  };

  const statusLabels = {
    'new_pricing': 'New Pricing',
    'researching': 'Researching',
    'completed': 'Completed',
    'sent_to_customer': 'Sent to Customer'
  };

  const handleDealClick = () => {
    setIsDealDetailsOpen(true);
  };

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Move expand/collapse button to the left */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="flex-shrink-0 mt-1"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">{quote.client_name}</h3>
              <Badge className={statusColors[quote.status]}>
                {statusLabels[quote.status]}
              </Badge>
              {quote.deal_registration_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDealClick}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Deal
                </Button>
              )}
              {/* Move notes button next to deal button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotesDialogOpen(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <FileText className="h-4 w-4 mr-1" />
                Notes
              </Button>
              
              {/* Move requirements badges to top next to notes button */}
              {quote.static_ip && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  /30 Static IP
                </Badge>
              )}
              {quote.slash_29 && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  /29 Static IP
                </Badge>
              )}
              {quote.dhcp && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  DHCP
                </Badge>
              )}
              {quote.mikrotik_required && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Router Required
                </Badge>
              )}
              {quote.categories && quote.categories.length > 0 && (
                quote.categories.map((category, index) => (
                  <Badge key={index} variant="outline" className="text-purple-600 border-purple-200 capitalize">
                    {category}
                  </Badge>
                ))
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{quote.location}</span>
              </div>
              {quote.suite && (
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  <span>Suite {quote.suite}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* Move created date to top right */}
          <div className="text-xs text-gray-500">
            Created: {quote.created_at}
          </div>
          
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteQuote}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <CircuitQuoteStatusSelect
                value={quote.status}
                onValueChange={onStatusChange}
              />
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <EditCircuitQuoteDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          quote={quote}
          onUpdateQuote={onUpdateQuote}
        />
      )}

      <CircuitQuoteNotesDialog
        open={isNotesDialogOpen}
        onOpenChange={setIsNotesDialogOpen}
        circuitQuoteId={quote.id}
        clientName={quote.client_name}
      />

      <DealDetailsDialog
        open={isDealDetailsOpen}
        onOpenChange={setIsDealDetailsOpen}
        dealId={quote.deal_registration_id}
      />
    </>
  );
};
