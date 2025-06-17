
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QuoteDetailsSection } from "@/components/QuoteDetailsSection";

interface EditQuoteHeaderProps {
  quoteNumber: string;
  onQuoteNumberChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
}

export const EditQuoteHeader = ({
  quoteNumber,
  onQuoteNumberChange,
  date,
  onDateChange,
  expiresAt,
  onExpiresAtChange
}: EditQuoteHeaderProps) => {
  return (
    <DialogHeader>
      <div className="flex justify-between items-start bg-muted/30 p-4 rounded-lg -mx-6 -mt-6 mb-6">
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
        />
      </div>
    </DialogHeader>
  );
};
