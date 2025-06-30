import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CarrierTagsProps {
  carriers: CarrierQuote[];
  onCarrierClick?: (carrierName: string) => void;
}

export const CarrierTags = ({ carriers, onCarrierClick }: CarrierTagsProps) => {
  // Sort carriers by carrier name first, then by speed
  const sortedCarriers = [...carriers].sort((a, b) => {
    const carrierComparison = a.carrier.localeCompare(b.carrier);
    if (carrierComparison !== 0) {
      return carrierComparison;
    }
    return a.speed.localeCompare(b.speed);
  });

  // Group carriers by vendor name and calculate summary for each vendor
  const carriersByVendor = new Map<string, CarrierQuote[]>();
  
  sortedCarriers.forEach(carrier => {
    if (!carriersByVendor.has(carrier.carrier)) {
      carriersByVendor.set(carrier.carrier, []);
    }
    carriersByVendor.get(carrier.carrier)!.push(carrier);
  });

  // Create display data for each vendor with summary information
  const vendorDisplayData = Array.from(carriersByVendor.entries()).map(([vendorName, vendorCarriers]) => {
    // Use the first carrier for display properties
    const displayCarrier = vendorCarriers[0];
    let hasPendingQuotes = false;
    let hasNoService = false;
    let lowestPrice: number | null = null;
    
    // Analyze all carriers for this vendor
    vendorCarriers.forEach(carrier => {
      if (carrier.no_service) {
        hasNoService = true;
      } else if (!carrier.price || carrier.price === 0) {
        hasPendingQuotes = true;
      } else {
        if (lowestPrice === null || carrier.price < lowestPrice) {
          lowestPrice = carrier.price;
        }
      }
    });

    // Determine summary text
    let summaryText = "";
    if (hasNoService) {
      summaryText = "No service";
    } else if (lowestPrice !== null) {
      summaryText = `prices starting at $${lowestPrice.toFixed(2)}`;
    } else if (hasPendingQuotes) {
      summaryText = "Pricing pending";
    }

    const isPending = hasPendingQuotes && !hasNoService && lowestPrice === null;
    
    return {
      vendorName,
      displayCarrier,
      isPending,
      summaryText
    };
  });

  const handleCarrierClick = (vendorName: string) => {
    if (onCarrierClick) {
      onCarrierClick(vendorName);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {vendorDisplayData.map(({ vendorName, displayCarrier, isPending, summaryText }) => (
        <div
          key={vendorName}
          className={`inline-flex flex-col items-start px-3 py-2 rounded-lg text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${
            isPending ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: displayCarrier.color || '#3B82F6' }}
          onClick={() => handleCarrierClick(vendorName)}
        >
          <div className="text-xs font-medium">
            {vendorName}
          </div>
          {summaryText && (
            <div className="text-xs opacity-90 mt-1">
              {summaryText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
