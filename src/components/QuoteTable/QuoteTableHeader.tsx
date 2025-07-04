
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = 'salesperson' | 'quoteNumber' | 'customerName' | 'status' | 'createdDate';
type SortDirection = 'asc' | 'desc';

interface QuoteTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const QuoteTableHeader = ({ sortField, sortDirection, onSort }: QuoteTableHeaderProps) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <TableHead>Salesperson</TableHead>
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => onSort('createdDate')}
          className="h-auto p-0 font-medium text-left justify-start"
        >
          Date
          {getSortIcon('createdDate')}
        </Button>
      </TableHead>
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => onSort('quoteNumber')}
          className="h-auto p-0 font-medium text-left justify-start"
        >
          Quote #
          {getSortIcon('quoteNumber')}
        </Button>
      </TableHead>
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => onSort('customerName')}
          className="h-auto p-0 font-medium text-left justify-start"
        >
          Customer
          {getSortIcon('customerName')}
        </Button>
      </TableHead>
      <TableHead>Description</TableHead>
      <TableHead>NRC</TableHead>
      <TableHead>MRC</TableHead>
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => onSort('status')}
          className="h-auto p-0 font-medium text-left justify-start"
        >
          Status
          {getSortIcon('status')}
        </Button>
      </TableHead>
      <TableHead>Actions</TableHead>
    </>
  );
};
