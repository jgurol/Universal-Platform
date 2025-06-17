
import { MapPin, Calendar } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteHeaderProps {
  quote: CircuitQuote & {
    client?: string;
    creationDate?: string;
  };
  showPriceDisplay?: boolean;
}

export const CircuitQuoteHeader = ({ quote, showPriceDisplay = false }: CircuitQuoteHeaderProps) => {
  // Support both client_name and client for backward compatibility
  const clientName = quote.client_name || quote.client || 'Unknown Client';
  const creationDate = quote.created_at || quote.creationDate || 'Unknown Date';

  // Format the full address
  const fullAddress = quote.suite 
    ? `${quote.location}, Suite ${quote.suite}`
    : quote.location;

  // Calculate price range, handling cases where price might be 0 (waiting for quote)
  const carriersWithPrices = quote.carriers.filter(c => c.price > 0);
  const priceDisplay = carriersWithPrices.length > 0 
    ? `$${Math.min(...carriersWithPrices.map(c => c.price))} - $${Math.max(...carriersWithPrices.map(c => c.price))}`
    : quote.carriers.length > 0 
      ? "Pending quotes"
      : "No quotes yet";

  if (showPriceDisplay) {
    return (
      <div className="text-right">
        <div className="text-sm text-gray-600">{quote.carriers.length} Carriers</div>
        <div className="text-lg font-semibold">
          {priceDisplay}
        </div>
      </div>
    );
  }

  return (
    <div>
      <CardTitle className="text-lg">{clientName}</CardTitle>
      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {fullAddress}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {creationDate}
        </div>
      </div>
    </div>
  );
};
