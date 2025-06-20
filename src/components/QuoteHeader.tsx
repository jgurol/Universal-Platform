
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface QuoteHeaderProps {
  quoteCount: number;
  onAddQuote: () => void;
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
}

export const QuoteHeader = ({ 
  quoteCount, 
  onAddQuote,
  searchTerm = "",
  onSearchChange
}: QuoteHeaderProps) => {
  const { user } = useAuth(); // Allow any logged-in user to add quotes

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Recent Quotes ({quoteCount})
        </h2>
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search quotes, descriptions, or items..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        )}
      </div>
      {user && (
        <Button 
          onClick={onAddQuote}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Quote
        </Button>
      )}
    </div>
  );
};
