import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Pencil, 
  Trash2,
  ExternalLink,
  FileText
} from "lucide-react";
import { ClientInfo } from "@/types/index";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface DealRegistrationCardProps {
  deal: any; // Replace 'any' with the actual Deal type if available
  clientInfos: ClientInfo[];
  onEditClick?: (deal: any) => void; // Replace 'any' with the actual Deal type
  onDeleteClick?: (dealId: string) => void;
}

export const DealRegistrationCard = ({
  deal,
  clientInfos,
  onEditClick,
  onDeleteClick
}: DealRegistrationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const clientInfo = clientInfos.find(ci => ci.id === deal.client_info_id);

  const handleDeleteClick = () => {
    if (onDeleteClick && deal.id) {
      onDeleteClick(deal.id);
    }
  };

  return (
    <Card className="bg-white shadow-md border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {deal.name || "Deal Registration"}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {deal.status && (
            <Badge variant="secondary" className="text-xs">
              {deal.status}
            </Badge>
          )}
          {onEditClick && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-blue-600 h-8 w-8 p-0"
              onClick={() => onEditClick(deal)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDeleteClick && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
              onClick={handleDeleteClick}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>
              {clientInfo ? clientInfo.company_name : "No Client Assigned"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{deal.location || "No Location"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created: {formatDateForDisplay(deal.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Potential Value: ${deal.potential_value?.toLocaleString() || "0"}</span>
          </div>
          {deal.circuit_quote_id && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Circuit Quote ID: {deal.circuit_quote_id}</span>
            </div>
          )}
          {deal.url && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Deal
              </a>
            </div>
          )}
          {isExpanded && (
            <div className="mt-2">
              <h5 className="font-semibold">Additional Notes:</h5>
              <p className="text-gray-700">{deal.notes || "No additional notes."}</p>
            </div>
          )}
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

