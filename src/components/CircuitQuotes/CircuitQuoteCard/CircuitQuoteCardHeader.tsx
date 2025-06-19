
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { CircuitQuoteStatusSelect } from "@/components/CircuitQuoteStatusSelect";
import { EditCircuitQuoteDialog } from "@/components/EditCircuitQuoteDialog";
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

  const handleEditQuote = () => {
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuote = (updatedQuote: CircuitQuote) => {
    if (onUpdateQuote) {
      onUpdateQuote(updatedQuote);
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
              Created: {quote.created_at}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quote Requirements Badges */}
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

          <CircuitQuoteStatusSelect
            status={quote.status}
            onStatusChange={onStatusChange}
          />
          
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
        </div>
      </div>

      {onUpdateQuote && (
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
