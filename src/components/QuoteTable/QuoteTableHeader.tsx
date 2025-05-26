
import { TableCell, TableHead } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";

type SortField = 'salesperson' | 'quoteNumber' | 'customerName' | 'status' | 'dateApproved';
type SortDirection = 'asc' | 'desc';

interface QuoteTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const QuoteTableHeader = ({ sortField, sortDirection, onSort }: QuoteTableHeaderProps) => {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  return (
    <>
      <TableHead className="w-16">
        <button
          onClick={() => onSort('salesperson')}
          className="flex items-center hover:text-gray-900 font-medium"
        >
          Agent
          <SortIcon field="salesperson" />
        </button>
      </TableHead>
      <TableHead>
        <button
          onClick={() => onSort('quoteNumber')}
          className="flex items-center hover:text-gray-900 font-medium"
        >
          Quote #
          <SortIcon field="quoteNumber" />
        </button>
      </TableHead>
      <TableHead>
        <button
          onClick={() => onSort('customerName')}
          className="flex items-center hover:text-gray-900 font-medium"
        >
          Customer
          <SortIcon field="customerName" />
        </button>
      </TableHead>
      <TableHead>Description</TableHead>
      <TableHead className="text-right">NRC Total</TableHead>
      <TableHead className="text-right">MRC Total</TableHead>
      <TableHead>
        <button
          onClick={() => onSort('status')}
          className="flex items-center hover:text-gray-900 font-medium"
        >
          Status
          <SortIcon field="status" />
        </button>
      </TableHead>
      <TableHead className="text-center">
        <button
          onClick={() => onSort('dateApproved')}
          className="flex items-center hover:text-gray-900 font-medium"
        >
          Date Approved
          <SortIcon field="dateApproved" />
        </button>
      </TableHead>
      <TableHead className="text-center">Actions</TableHead>
    </>
  );
};
