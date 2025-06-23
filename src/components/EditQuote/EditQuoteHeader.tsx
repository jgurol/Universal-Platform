
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QuoteDetailsSection } from "@/components/QuoteDetailsSection";
import { Client } from "@/types/index";

interface EditQuoteHeaderProps {
  quoteNumber: string;
  onQuoteNumberChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  selectedSalesperson?: Client | null;
}

export const EditQuoteHeader = ({
  quoteNumber,
  onQuoteNumberChange,
  date,
  onDateChange,
  expiresAt,
  onExpiresAtChange,
  selectedSalesperson
}: EditQuoteHeaderProps) => {
  return (
    <DialogHeader>
      <div className="flex justify-between items-start">
        <div>
          <DialogTitle>Edit Quote</DialogTitle>
          <DialogDescription>
            Update the quote details and items. A new version number will be assigned.
          </DialogDescription>
        </div>
        
        <QuoteDetailsSection
          quoteNumber={quoteNumber}
          onQuoteNumberChange={onQuoteNumberChange}
          date={date}
          onDateChange={onDateChange}
          expiresAt={expiresAt}
          onExpiresAtChange={onExpiresAtChange}
          selectedSalesperson={selectedSalesperson}
        />
      </div>
    </DialogHeader>
  );
};
