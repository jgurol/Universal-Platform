import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/index";

interface QuoteDetailsSectionProps {
  quoteNumber: string;
  onQuoteNumberChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  selectedSalesperson?: Client | null;
}

export const QuoteDetailsSection = ({
  quoteNumber,
  onQuoteNumberChange,
  date,
  onDateChange,
  expiresAt,
  onExpiresAtChange,
  selectedSalesperson
}: QuoteDetailsSectionProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 min-w-[280px]">
      <div className="space-y-2">
        <Label htmlFor="quoteNumber" className="text-sm">Quote Number (New Version)</Label>
        <Input
          id="quoteNumber"
          value={quoteNumber}
          onChange={(e) => onQuoteNumberChange(e.target.value)}
          placeholder="Auto-generated version number"
          className="h-8 bg-muted"
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm">Quote Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required
          className="h-8"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt" className="text-sm">Expiration Date</Label>
        <Input
          id="expiresAt"
          type="date"
          value={expiresAt}
          onChange={(e) => onExpiresAtChange(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Associated Salesperson moved here */}
      {selectedSalesperson && (
        <div className="space-y-2">
          <Label className="text-sm">Associated Salesperson</Label>
          <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm">
            {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
          </div>
        </div>
      )}
    </div>
  );
};
