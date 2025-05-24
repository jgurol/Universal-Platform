
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Building, FileText, Users, Pencil, Trash2, Calendar } from "lucide-react";
import { Quote, ClientInfo } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface QuoteCardProps {
  quote: Quote;
  clientInfos: ClientInfo[];
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

// Array for month names - needed for display
const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const QuoteCard = ({
  quote,
  clientInfos,
  onEditClick,
  onDeleteQuote
}: QuoteCardProps) => {
  const { isAdmin } = useAuth();

  const handleDeleteQuote = () => {
    if (onDeleteQuote) {
      onDeleteQuote(quote.id);
    }
  };

  const isExpired = quote.expiresAt && new Date(quote.expiresAt) < new Date();

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900">{quote.clientName}</h4>
          <Badge variant="outline" className="text-xs">
            ${quote.amount.toLocaleString()}
          </Badge>
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 font-mono">
            ID: {quote.id.slice(0, 8)}...
          </Badge>
          {quote.status && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                quote.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                quote.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </Badge>
          )}
          {isExpired && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
              <Clock className="w-3 h-3 mr-1" />
              Expired
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 mb-1 text-sm text-gray-600">
          <Building className="w-4 h-4" />
          {quote.companyName}
        </div>
        {/* Display client company if available */}
        {quote.clientInfoId && quote.clientInfoId !== "none" && (
          <div className="flex items-center gap-1 mb-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            Client: {quote.clientCompanyName || clientInfos.find(ci => ci.id === quote.clientInfoId)?.company_name || "N/A"}
          </div>
        )}
        <div className="text-sm text-gray-600 flex items-center gap-1">
          {quote.quoteNumber && (
            <>
              <FileText className="w-3 h-3" />
              <span>Quote #{quote.quoteNumber}</span>
              {quote.quoteMonth && quote.quoteYear && (
                <span className="text-gray-500">
                  ({months.find(m => m.value === quote.quoteMonth)?.label} {quote.quoteYear})
                </span>
              )}
            </>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {quote.description}
        </div>
        
        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
          <span>Date: {formatDateForDisplay(quote.date)}</span>
          {quote.expiresAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Expires: {formatDateForDisplay(quote.expiresAt)}
            </span>
          )}
        </div>
        
        {/* Commission section */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <div className="font-medium text-gray-600">
            Commission: ${quote.commission?.toFixed(2) || '0.00'}
          </div>
          {isAdmin && onDeleteQuote && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDeleteQuote}
              >
                <Trash2 className="w-3 h-3 mr-1 text-red-600" /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>
      {isAdmin && onEditClick && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-500 hover:text-blue-600"
          onClick={() => onEditClick(quote)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
