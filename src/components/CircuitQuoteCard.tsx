import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MapPin, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddCarrierQuoteDialog } from "@/components/AddCarrierQuoteDialog";
import { EditCarrierQuoteDialog } from "@/components/EditCarrierQuoteDialog";
import type { CircuitQuote, CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteCardProps {
  quote: CircuitQuote & {
    client?: string;
    creationDate?: string;
  };
  onUpdate: (quote: any) => void;
  onAddCarrier?: (carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => void;
  onUpdateCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

export const CircuitQuoteCard = ({ 
  quote, 
  onUpdate, 
  onAddCarrier, 
  onUpdateCarrier, 
  onDeleteCarrier,
  onDeleteQuote
}: CircuitQuoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddCarrierDialogOpen, setIsAddCarrierDialogOpen] = useState(false);
  const [isEditCarrierDialogOpen, setIsEditCarrierDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<CarrierQuote | null>(null);

  const handleStatusChange = (newStatus: string) => {
    const updatedQuote = {
      ...quote,
      status: newStatus as 'new_pricing' | 'researching' | 'completed' | 'ready_for_review' | 'sent_to_customer'
    };
    onUpdate(updatedQuote);
  };

  const handleDeleteQuote = () => {
    if (onDeleteQuote) {
      onDeleteQuote(quote.id);
    }
  };

  const addCarrierQuote = (carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    if (onAddCarrier) {
      onAddCarrier(carrierQuote);
    } else {
      // Fallback for backward compatibility
      const newCarrierQuote: CarrierQuote = {
        ...carrierQuote,
        id: Date.now().toString(),
        circuit_quote_id: quote.id
      };
      
      const updatedQuote = {
        ...quote,
        carriers: [...quote.carriers, newCarrierQuote]
      };
      
      onUpdate(updatedQuote);
    }
  };

  const editCarrierQuote = (updatedCarrier: CarrierQuote) => {
    if (onUpdateCarrier) {
      onUpdateCarrier(updatedCarrier);
    } else {
      // Fallback for backward compatibility
      const updatedQuote = {
        ...quote,
        carriers: quote.carriers.map(carrier => 
          carrier.id === updatedCarrier.id ? updatedCarrier : carrier
        )
      };
      
      onUpdate(updatedQuote);
    }
  };

  const deleteCarrierQuote = (carrierId: string) => {
    if (onDeleteCarrier) {
      onDeleteCarrier(carrierId);
    } else {
      // Fallback for backward compatibility
      const updatedQuote = {
        ...quote,
        carriers: quote.carriers.filter(carrier => carrier.id !== carrierId)
      };
      
      onUpdate(updatedQuote);
    }
  };

  const handleEditCarrier = (carrier: CarrierQuote) => {
    setEditingCarrier(carrier);
    setIsEditCarrierDialogOpen(true);
  };

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

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-8 w-8"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
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
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">{quote.carriers.length} Carriers</div>
              <div className="text-lg font-semibold">
                {priceDisplay}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={quote.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="new_pricing">New Pricing</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                  <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
                </SelectContent>
              </Select>
              {onDeleteQuote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteQuote}
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
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {quote.carriers.map((carrier) => {
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
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Carrier Quotes</h4>
              <Button
                size="sm"
                onClick={() => setIsAddCarrierDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Carrier
              </Button>
            </div>
            
            <div className="grid gap-3">
              {quote.carriers.map((carrier) => {
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCarrier(carrier)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCarrierQuote(carrier.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}

      <AddCarrierQuoteDialog
        open={isAddCarrierDialogOpen}
        onOpenChange={setIsAddCarrierDialogOpen}
        onAddCarrier={addCarrierQuote}
      />

      {editingCarrier && (
        <EditCarrierQuoteDialog
          open={isEditCarrierDialogOpen}
          onOpenChange={setIsEditCarrierDialogOpen}
          carrier={editingCarrier}
          onUpdateCarrier={editCarrierQuote}
        />
      )}
    </Card>
  );
};
