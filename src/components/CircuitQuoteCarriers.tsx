
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteCarriersProps {
  carriers: CarrierQuote[];
  isMinimized?: boolean;
  onAddCarrier?: () => void;
  onEditCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onCopyCarrier?: (carrier: CarrierQuote) => void;
  staticIp?: boolean;
  slash29?: boolean;
}

export const CircuitQuoteCarriers = ({ 
  carriers, 
  isMinimized = false, 
  onAddCarrier, 
  onEditCarrier, 
  onDeleteCarrier,
  onCopyCarrier,
  staticIp = false,
  slash29 = false
}: CircuitQuoteCarriersProps) => {
  const getTickedCheckboxes = (carrier: CarrierQuote) => {
    const ticked = [];
    if (carrier.install_fee) ticked.push("Install Fee");
    if (carrier.site_survey_needed) ticked.push("Site Survey");
    if (carrier.no_service) ticked.push("No Service");
    return ticked;
  };

  // Sort carriers by carrier name first, then by speed
  const sortedCarriers = [...carriers].sort((a, b) => {
    // First sort by carrier name
    const carrierComparison = a.carrier.localeCompare(b.carrier);
    if (carrierComparison !== 0) {
      return carrierComparison;
    }
    
    // If carrier names are the same, sort by speed
    return a.speed.localeCompare(b.speed);
  });

  if (isMinimized) {
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

      // Add quote-level options to the display
      if (staticIp) allTickedOptions.add("Static IP");
      if (slash29) allTickedOptions.add("/29");

      const tickedOptionsArray = Array.from(allTickedOptions);
      const isPending = hasPendingQuotes;
      
      // Create tooltip with all carrier info for this vendor
      const tooltipParts = vendorCarriers.map(carrier => {
        const carrierTickedOptions = getTickedCheckboxes(carrier);
        const priceText = carrier.no_service ? 'No Service' : (carrier.price > 0 ? `$${carrier.price}` : 'Pending quote');
        return `${carrier.type} - ${carrier.speed} - ${priceText}${carrierTickedOptions.length > 0 ? ` - ${carrierTickedOptions.join(', ')}` : ''}`;
      });
      const tooltipText = `${vendorName} - ${tooltipParts.join(' | ')}`;
      
      return {
        vendorName,
        displayCarrier,
        tickedOptionsArray,
        isPending,
        tooltipText
      };
    });

    return (
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
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
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Carrier Quotes</h4>
        {onAddCarrier && (
          <Button
            size="sm"
            onClick={onAddCarrier}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Carrier
          </Button>
        )}
      </div>

      {/* Quote-level options display */}
      {(staticIp || slash29) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-2">Quote Requirements:</div>
          <div className="flex flex-wrap gap-2">
            {staticIp && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Static IP
              </span>
            )}
            {slash29 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                /29
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="grid gap-3">
        {sortedCarriers.map((carrier) => {
          const isPending = !carrier.price || carrier.price === 0;
          const isNoService = carrier.no_service;
          const tickedOptions = getTickedCheckboxes(carrier);
          
          return (
            <div 
              key={carrier.id} 
              className={`border rounded-lg p-4 ${
                isNoService ? 'bg-red-50 border-red-200' : 'bg-gray-50'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                <div>
                  <div 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
                      isPending && !isNoService ? 'animate-pulse' : ''
                    }`}
                    style={{ backgroundColor: carrier.color || '#3B82F6' }}
                  >
                    {carrier.carrier}
                  </div>
                </div>
                <div>
                  <div className="font-medium">{carrier.type}</div>
                </div>
                <div>
                  <div className="font-medium">{carrier.speed}</div>
                </div>
                <div>
                  <div className={`font-semibold text-lg ${isNoService ? 'text-red-600' : ''}`}>
                    {isNoService ? 'No Service' : (
                      carrier.price > 0 ? `$${carrier.price}` : (
                        <span className="text-orange-600 text-sm">Pending</span>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm">
                    {carrier.term && <div className="font-medium">{carrier.term}</div>}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600">
                    {tickedOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {tickedOptions.map((option, index) => (
                          <span 
                            key={index} 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              option === 'No Service' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                    {carrier.notes}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onCopyCarrier && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyCarrier(carrier)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                      title="Copy Carrier Quote"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  {onEditCarrier && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCarrier(carrier)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteCarrier && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCarrier(carrier.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
