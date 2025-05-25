
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
    <div className="flex items-center gap-2">
      <EmailStatusButton 
        quoteId={quote.id} 
        onEmailClick={onEmailClick}
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.open(`/quote/${quote.id}`, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />
            View Quote
          </DropdownMenuItem>
          {isAdmin && onEditClick && (
            <DropdownMenuItem onClick={() => onEditClick(quote)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {isAdmin && onCopyQuote && (
            <DropdownMenuItem onClick={() => onCopyQuote(quote)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </DropdownMenuItem>
          )}
          {isAdmin && onDeleteQuote && (
            <DropdownMenuItem 
              onClick={() => onDeleteQuote(quote.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
