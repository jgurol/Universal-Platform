
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface QuoteHeaderProps {
  quoteCount: number;
  onAddQuote: () => void;
}

export const QuoteHeader = ({
  quoteCount,
  onAddQuote
}: QuoteHeaderProps) => {
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-row items-center justify-between space-y-0">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Quotes</h3>
        <p className="text-sm text-muted-foreground">
          Client quotes ({quoteCount} total)
        </p>
      </div>
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Button 
            size="sm"
            onClick={onAddQuote}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Quote
          </Button>
        )}
      </div>
    </div>
  );
};
