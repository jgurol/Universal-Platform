
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteCarriersProps {
  carriers: CarrierQuote[];
  isMinimized?: boolean;
  onAddCarrier?: () => void;
  onEditCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
}

export const CircuitQuoteCarriers = ({ 
  carriers, 
  isMinimized = false, 
  onAddCarrier, 
  onEditCarrier, 
  onDeleteCarrier 
}: CircuitQuoteCarriersProps) => {
  if (isMinimized) {
    return (
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {carriers.map((carrier) => {
          const isPending = !carrier.price || carrier.price === 0;
          return (
            <div
              key={carrier.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
                isPending ? 'animate-pulse' : ''
              }`}
              style={{ backgroundColor: carrier.color || '#3B82F6' }}
              title={`${carrier.carrier} - ${carrier.type} - ${carrier.speed} - ${carrier.price > 0 ? `$${carrier.price}` : 'Pending quote'}`}
            >
              {carrier.carrier}
            </div>
          );
        })}
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
      
      <div className="grid gap-3">
        {carriers.map((carrier) => {
          const isPending = !carrier.price || carrier.price === 0;
          return (
            <div key={carrier.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                <div>
                  <div 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
                      isPending ? 'animate-pulse' : ''
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
                  <div className="font-semibold text-lg">
                    {carrier.price > 0 ? `$${carrier.price}` : (
                      <span className="text-orange-600 text-sm">Pending</span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600">
                    {carrier.term && <div className="font-medium mb-1">{carrier.term}</div>}
                    {carrier.notes}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
