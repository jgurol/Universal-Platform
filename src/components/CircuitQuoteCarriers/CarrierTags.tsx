
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { useAuth } from "@/context/AuthContext";

interface CarrierTagsProps {
  carriers: CarrierQuote[];
}

export const CarrierTags = ({ carriers }: CarrierTagsProps) => {
  const { isAdmin } = useAuth();
  
  const getTickedCheckboxes = (carrier: CarrierQuote) => {
    const ticked = [];
    if (carrier.install_fee) ticked.push("Install Fee");
    if (carrier.site_survey_needed) ticked.push("Site Survey");
    if (carrier.no_service) ticked.push("No Service");
    if (carrier.static_ip) ticked.push("Includes Static IP");
    return ticked;
  };

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

  // Create display data for each vendor (showing only one tag)
  const vendorDisplayData = Array.from(carriersByVendor.entries()).map(([vendorName, vendorCarriers]) => {
    // Use the first carrier for display properties
    const displayCarrier = vendorCarriers[0];
    const allTickedOptions = new Set<string>();
    let hasPendingQuotes = false;
    
    // Aggregate information from all carriers of this vendor
    vendorCarriers.forEach(carrier => {
      const tickedOptions = getTickedCheckboxes(carrier);
      tickedOptions.forEach(option => allTickedOptions.add(option));
      
      if (!carrier.price || carrier.price === 0) hasPendingQuotes = true;
    });

    const tickedOptionsArray = Array.from(allTickedOptions);
    const isPending = hasPendingQuotes;
    
    // Create tooltip with carrier info - show prices only for admins
    const tooltipParts = vendorCarriers.map(carrier => {
      const carrierTickedOptions = getTickedCheckboxes(carrier);
      let carrierInfo = `${carrier.type} - ${carrier.speed}`;
      
      // Only show price info for admins
      if (isAdmin) {
        const priceText = carrier.no_service ? 'No Service' : (carrier.price > 0 ? `$${carrier.price}` : 'Pending quote');
        carrierInfo += ` - ${priceText}`;
      } else {
        // For agents, just show availability status
        const statusText = carrier.no_service ? 'No Service' : 'Available';
        carrierInfo += ` - ${statusText}`;
      }
      
      if (carrierTickedOptions.length > 0) {
        carrierInfo += ` - ${carrierTickedOptions.join(', ')}`;
      }
      
      return carrierInfo;
    });
    
    let tooltipText = `${vendorName} - ${tooltipParts.join('   | ')}`;
    
    return {
      vendorName,
      displayCarrier,
      tickedOptionsArray,
      isPending,
      tooltipText
    };
  });

  return (
    <div className="flex flex-wrap gap-2">
      {vendorDisplayData.map(({ vendorName, displayCarrier, tickedOptionsArray, isPending, tooltipText }) => (
        <div
          key={vendorName}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
            isPending ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: displayCarrier.color || '#3B82F6' }}
          title={tooltipText}
        >
          <span className="mr-1">{vendorName}</span>
          {tickedOptionsArray.length > 0 && (
            <span className="text-xs opacity-75">({tickedOptionsArray.join(', ')})</span>
          )}
        </div>
      ))}
    </div>
  );
};
