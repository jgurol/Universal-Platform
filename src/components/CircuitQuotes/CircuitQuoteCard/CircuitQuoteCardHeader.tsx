
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { CircuitQuoteHeader } from "@/components/CircuitQuoteHeader";
import { CircuitQuoteStatusSelect } from "@/components/CircuitQuoteStatusSelect";
import { CircuitQuoteCarriers } from "@/components/CircuitQuoteCarriers";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteCardHeaderProps {
  quote: CircuitQuote & {
    client?: string;
    creationDate?: string;
  };
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: string) => void;
  onDeleteQuote?: () => void;
}

export const CircuitQuoteCardHeader = ({
  quote,
  isExpanded,
  onToggleExpanded,
  onStatusChange,
  onDeleteQuote
}: CircuitQuoteCardHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="p-1 h-8 w-8"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <CircuitQuoteHeader quote={quote} />
        </div>
        <div className="flex items-center gap-3">
          <CircuitQuoteHeader quote={quote} showPriceDisplay />
          <div className="flex items-center gap-2">
            <CircuitQuoteStatusSelect 
              status={quote.status} 
              onStatusChange={onStatusChange} 
            />
            {onDeleteQuote && (
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
      </div>
      
      {/* Show vendor badges when minimized */}
      {!isExpanded && quote.carriers.length > 0 && (
        <CircuitQuoteCarriers 
          carriers={quote.carriers} 
          isMinimized 
        />
      )}
    </>
  );
};
