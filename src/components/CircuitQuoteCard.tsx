
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MapPin, Building, Calendar, Plus } from "lucide-react";
import { CircuitQuote, CarrierQuote } from "@/components/CircuitQuotesManagement";
import { AddCarrierQuoteDialog } from "@/components/AddCarrierQuoteDialog";

interface CircuitQuoteCardProps {
  quote: CircuitQuote;
  onUpdate: (quote: CircuitQuote) => void;
}

export const CircuitQuoteCard = ({ quote, onUpdate }: CircuitQuoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddCarrierDialogOpen, setIsAddCarrierDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'researching':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Researching</Badge>;
      case 'quoted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Quoted</Badge>;
      case 'published':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Published</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const addCarrierQuote = (carrierQuote: Omit<CarrierQuote, "id">) => {
    const newCarrierQuote: CarrierQuote = {
      ...carrierQuote,
      id: Date.now().toString()
    };
    
    const updatedQuote: CircuitQuote = {
      ...quote,
      carriers: [...quote.carriers, newCarrierQuote]
    };
    
    onUpdate(updatedQuote);
  };

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
              <CardTitle className="text-lg">{quote.client}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {quote.location}
                </div>
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Suite {quote.suite}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {quote.creationDate}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">{quote.carriers.length} Carriers</div>
              <div className="text-lg font-semibold">
                ${Math.min(...quote.carriers.map(c => c.price))} - ${Math.max(...quote.carriers.map(c => c.price))}
              </div>
            </div>
            {getStatusBadge(quote.status)}
          </div>
        </div>
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
              {quote.carriers.map((carrier) => (
                <div key={carrier.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <Badge className={carrier.color}>
                        {carrier.carrier}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">{carrier.type}</div>
                    </div>
                    <div>
                      <div className="font-medium">{carrier.speed}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">${carrier.price}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600">{carrier.notes}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      <AddCarrierQuoteDialog
        open={isAddCarrierDialogOpen}
        onOpenChange={setIsAddCarrierDialogOpen}
        onAddCarrier={addCarrierQuote}
      />
    </Card>
  );
};
