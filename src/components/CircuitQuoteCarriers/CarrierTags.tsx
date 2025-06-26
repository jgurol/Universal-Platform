
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CarrierTagsProps {
  carriers: CarrierQuote[];
}

export const CarrierTags = ({ carriers }: CarrierTagsProps) => {
  // Sort carriers by carrier name first, then by speed
  const sortedCarriers = [...carriers].sort((a, b) => {
    const carrierComparison = a.carrier.localeCompare(b.carrier);
    if (carrierComparison !== 0) {
      return carrierComparison;
    }
    return a.speed.localeCompare(b.speed);
  });

  // Group carriers by vendor name and show only one tag per vendor
  const carriersByVendor = new Map<string, CarrierQuote[]>();
  
  sortedCarriers.forEach(carrier => {
    if (!carriersByVendor.has(carrier.carrier)) {
      carriersByVendor.set(carrier.carrier, []);
    }
    carriersByVendor.get(carrier.carrier)!.push(carrier);
  });

  // Create display data for each vendor (showing only vendor name)
  const vendorDisplayData = Array.from(carriersByVendor.entries()).map(([vendorName, vendorCarriers]) => {
    // Use the first carrier for display properties
    const displayCarrier = vendorCarriers[0];
    let hasPendingQuotes = false;
    
    // Check if any carriers have pending quotes for animation
    vendorCarriers.forEach(carrier => {
      if (!carrier.price || carrier.price === 0) hasPendingQuotes = true;
    });

    const isPending = hasPendingQuotes;
    
    return {
      vendorName,
      displayCarrier,
      isPending
    };
  });

  return (
    <div className="flex flex-wrap gap-2">
      {vendorDisplayData.map(({ vendorName, displayCarrier, isPending }) => (
        <div
          key={vendorName}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
            isPending ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: displayCarrier.color || '#3B82F6' }}
        >
          {vendorName}
        </div>
      ))}
    </div>
  );
};
