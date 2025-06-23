
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CommissionDetailsTabProps {
  commissionRate?: number;
  onCommissionRateChange?: (value: number) => void;
  commissionNotes?: string;
  onCommissionNotesChange?: (value: string) => void;
}

export const CommissionDetailsTab = ({
  commissionRate = 0,
  onCommissionRateChange,
  commissionNotes = "",
  onCommissionNotesChange
}: CommissionDetailsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
        <Input
          id="commissionRate"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={commissionRate}
          onChange={(e) => onCommissionRateChange?.(parseFloat(e.target.value) || 0)}
          placeholder="Enter commission rate"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="commissionNotes">Commission Notes</Label>
        <Textarea
          id="commissionNotes"
          value={commissionNotes}
          onChange={(e) => onCommissionNotesChange?.(e.target.value)}
          placeholder="Additional notes about commission"
          rows={3}
        />
      </div>
    </div>
  );
};
