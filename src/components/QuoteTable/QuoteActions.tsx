
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Quote, ClientInfo } from "@/types/index";
import { MoreHorizontal, Edit, Trash2, Copy, Mail, Archive, ArchiveRestore } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuoteActionsProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName?: string;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onCopyQuote?: (quote: Quote) => void;
  onEmailClick?: () => void;
  onStatusUpdate?: (newStatus: string) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
}

export const QuoteActions = ({
  quote,
  clientInfo,
  salespersonName,
  onEditClick,
  onDeleteQuote,
  onCopyQuote,
  onEmailClick,
  onStatusUpdate,
  onUnarchiveQuote
}: QuoteActionsProps) => {
  const [status, setStatus] = useState(quote.status || 'pending');

  const handleStatusChange = (value: string) => {
    setStatus(value);
    if (onStatusUpdate) {
      onStatusUpdate(value);
    }
  };

  const handleDelete = () => {
    if (onDeleteQuote) {
      onDeleteQuote(quote.id);
    }
  };

  const handleCopy = () => {
    if (onCopyQuote) {
      onCopyQuote(quote);
    }
  };

  const handleEdit = () => {
    if (onEditClick) {
      onEditClick(quote);
    }
  };

  const handleEmail = () => {
    if (onEmailClick) {
      onEmailClick();
    }
  };

  const handleUnarchive = () => {
    if (onUnarchiveQuote) {
      onUnarchiveQuote(quote.id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-28">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Quote
          </DropdownMenuItem>
          {quote.status === 'archived' ? (
            <DropdownMenuItem onClick={handleUnarchive}>
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Unarchive Quote
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4 text-red-600" />
              Delete Quote
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
