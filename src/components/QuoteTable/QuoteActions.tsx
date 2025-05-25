import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Copy, Trash2 } from "lucide-react";
import { Quote, ClientInfo } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";
import { EmailStatusButton } from "./EmailStatusButton";

interface QuoteActionsProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName: string;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onCopyQuote?: (quote: Quote) => void;
  onEmailClick: () => void;
}

export const QuoteActions = ({
  quote,
  clientInfo,
  salespersonName,
  onEditClick,
  onDeleteQuote,
  onCopyQuote,
  onEmailClick
}: QuoteActionsProps) => {
  const { isAdmin } = useAuth();

  console.log('QuoteActions - Rendering for quote:', quote.id, 'Email status:', quote.email_status);

  return (
    <div className="flex items-center gap-1">
      <EmailStatusButton 
        quoteId={quote.id} 
        onEmailClick={onEmailClick}
      />
      
      {/* View Quote button - always visible */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
        onClick={() => window.open(`/quote/${quote.id}`, '_blank')}
        title="View Quote"
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {/* Direct action buttons for admins */}
      {isAdmin && (
        <>
          {onEditClick && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onEditClick(quote)}
              title="Edit Quote"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {onCopyQuote && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onCopyQuote(quote)}
              title="Copy Quote"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          
          {onDeleteQuote && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDeleteQuote(quote.id)}
              title="Delete Quote"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      
      {/* Dropdown menu for additional actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Keep dropdown empty for now or add other future actions */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
