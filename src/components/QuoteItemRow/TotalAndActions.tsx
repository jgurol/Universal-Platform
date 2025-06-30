import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TotalAndActionsProps {
  totalPrice: number;
  commissionAmount: number;
  isAgentOptedOut: boolean;
  onRemoveItem: () => void;
}

export const TotalAndActions = ({ 
  totalPrice, 
  commissionAmount, 
  isAgentOptedOut, 
  onRemoveItem 
}: TotalAndActionsProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          ${totalPrice.toFixed(2)}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemoveItem}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      {!isAgentOptedOut && (
        <div className="text-xs text-gray-600">
          Commission: ${commissionAmount.toFixed(2)}
        </div>
      )}
    </div>
  );
};
