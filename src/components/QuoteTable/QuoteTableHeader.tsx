
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

type SortField = 'salesperson' | 'quoteNumber' | 'customerName' | 'status';
type SortDirection = 'asc' | 'desc';

interface QuoteTableHeaderProps {
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const QuoteTableHeader = ({ sortField, sortDirection, onSort }: QuoteTableHeaderProps) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <>
      <th className="font-semibold text-left">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
          onClick={() => onSort('salesperson')}
        >
          Salesperson
          {getSortIcon('salesperson')}
        </Button>
      </th>
      <th className="font-semibold text-left">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
          onClick={() => onSort('quoteNumber')}
        >
          Quote Number
          {getSortIcon('quoteNumber')}
        </Button>
      </th>
      <th className="font-semibold text-left">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
          onClick={() => onSort('customerName')}
        >
          Customer Name
          {getSortIcon('customerName')}
        </Button>
      </th>
      <th className="font-semibold text-left">Quote Name</th>
      <th className="font-semibold text-left">NRC</th>
      <th className="font-semibold text-left">MRC</th>
      <th className="font-semibold text-left">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
          onClick={() => onSort('status')}
        >
          Status
          {getSortIcon('status')}
        </Button>
      </th>
      <th className="font-semibold text-left">Actions</th>
    </>
  );
};
