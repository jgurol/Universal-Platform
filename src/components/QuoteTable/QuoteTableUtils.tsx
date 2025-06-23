import { Badge } from "@/components/ui/badge";
import { Quote } from "@/types/index";
import { Clock, CheckCircle, XCircle, FileText, Archive } from "lucide-react";

export const getStatusBadge = (quote: Quote) => {
  switch (quote.status) {
    case 'pending':
      return (
        <Badge variant="outline">
          <Clock className="mr-2 h-4 w-4" />
          Pending
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline">
          <CheckCircle className="mr-2 h-4 w-4" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline">
          <XCircle className="mr-2 h-4 w-4" />
          Rejected
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="outline">
          <Archive className="mr-2 h-4 w-4" />
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          {quote.status}
        </Badge>
      );
  }
};
