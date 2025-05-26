
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
      <th className="font-semibold text-center">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-center hover:bg-transparent flex items-center justify-center w-full"
          onClick={() => onSort('salesperson')}
        >
          Salesperson
          {getSortIcon('salesperson')}
        </Button>
      </th>
      <th className="font-semibold text-center">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-center hover:bg-transparent flex items-center justify-center w-full"
          onClick={() => onSort('quoteNumber')}
        >
          Quote Number
          {getSortIcon('quoteNumber')}
        </Button>
      </th>
      <th className="font-semibold text-center">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-center hover:bg-transparent flex items-center justify-center w-full"
          onClick={() => onSort('customerName')}
        >
          Customer Name
          {getSortIcon('customerName')}
        </Button>
      </th>
      <th className="font-semibold text-center">Quote Name</th>
      <th className="font-semibold text-center">NRC</th>
      <th className="font-semibold text-center">MRC</th>
      <th className="font-semibold text-center">
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-semibold text-center hover:bg-transparent flex items-center justify-center w-full"
          onClick={() => onSort('status')}
        >
          Status
          {getSortIcon('status')}
        </Button>
      </th>
      <th className="font-semibold text-center">Actions</th>
    </>
  );
};
