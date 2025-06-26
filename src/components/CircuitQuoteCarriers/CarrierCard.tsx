
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  Copy, 
  Trash2, 
  GripVertical, 
  MessageSquare,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { CarrierTags } from "./CarrierTags";
import { CarrierQuoteNotesDialog } from "@/components/CarrierQuoteNotesDialog";

interface CarrierCardProps {
  carrier: CarrierQuote;
  onEdit: (carrier: CarrierQuote) => void;
  onCopy: (carrier: CarrierQuote) => void;
  onDelete: (carrierId: string) => void;
  isMinimized?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export const CarrierCard = ({ 
  carrier, 
  onEdit, 
  onCopy, 
  onDelete, 
  isMinimized = false,
  isDragging = false,
  dragHandleProps 
}: CarrierCardProps) => {
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  const formatPrice = (price: number) => {
    return price > 0 ? `$${price.toFixed(2)}` : "TBD";
  };

  const getTotalMonthlyCost = () => {
    const baseCost = carrier.price || 0;
    const otherCosts = carrier.other_costs || 0;
    const staticIpCost = carrier.static_ip ? (carrier.static_ip_fee_amount || 0) : 0;
    const staticIp5Cost = carrier.static_ip_5 ? (carrier.static_ip_5_fee_amount || 0) : 0;
    
    return baseCost + otherCosts + staticIpCost + staticIp5Cost;
  };

  const getServiceIcon = () => {
    if (carrier.no_service) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (carrier.site_survey_needed) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getServiceStatus = () => {
    if (carrier.no_service) return "No Service";
    if (carrier.site_survey_needed) return "Survey Needed";
    return "Available";
  };

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between p-2 border rounded">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: carrier.color || '#3B82F6' }}
          />
          <span className="font-medium text-sm">{carrier.carrier}</span>
          <span className="text-xs text-gray-500">{carrier.type}</span>
          <span className="text-xs font-mono">{carrier.speed}</span>
        </div>
        <div className="flex items-center gap-2">
          {getServiceIcon()}
          <span className="font-semibold text-sm">{formatPrice(getTotalMonthlyCost())}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card 
        className={`border-l-4 transition-all duration-200 ${
          isDragging ? 'shadow-lg opacity-90' : 'hover:shadow-md'
        }`}
        style={{ borderLeftColor: carrier.color || '#3B82F6' }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {carrier.carrier}
                  {getServiceIcon()}
                </h3>
                <p className="text-sm text-gray-600">
                  {carrier.type} • {carrier.speed}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotesDialogOpen(true)}
                className="h-8 w-8 p-0"
                title="View/Add Notes"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(carrier)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(carrier)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(carrier.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Monthly Cost</p>
              <p className="font-semibold text-lg">{formatPrice(carrier.price)}</p>
              {(carrier.other_costs || 0) > 0 && (
                <p className="text-xs text-gray-500">
                  + ${carrier.other_costs?.toFixed(2)} other costs
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Monthly</p>
              <p className="font-bold text-lg text-green-600">
                {formatPrice(getTotalMonthlyCost())}
              </p>
            </div>
          </div>

          {carrier.term && (
            <div className="mb-3">
              <Badge variant="outline">{carrier.term}</Badge>
            </div>
          )}

          <CarrierTags carrier={carrier} />

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              {getServiceIcon()}
              <span className="text-sm font-medium">{getServiceStatus()}</span>
            </div>
            
            {carrier.install_fee && (
              <Badge variant="secondary">
                Install: ${carrier.install_fee_amount?.toFixed(2) || 'TBD'}
              </Badge>
            )}
          </div>

          {carrier.notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {carrier.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CarrierQuoteNotesDialog
        open={isNotesDialogOpen}
        onOpenChange={setIsNotesDialogOpen}
        carrierId={carrier.id}
        carrierName={`${carrier.carrier} - ${carrier.type}`}
        initialNotes={carrier.notes || ""}
        onNotesUpdate={(updatedNotes) => {
          // Update the carrier's notes
          const updatedCarrier = { ...carrier, notes: updatedNotes };
          onEdit(updatedCarrier);
        }}
      />
    </>
  );
};
