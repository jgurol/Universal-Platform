
import { Quote, ClientInfo } from "@/pages/Index";
import { QuoteCard } from "@/components/QuoteCard";

interface QuoteTableProps {
  quotes: Quote[];
  clientInfos: ClientInfo[];
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

export const QuoteTable = ({
  quotes,
  clientInfos,
  onEditClick,
  onDeleteQuote
}: QuoteTableProps) => {
  return (
    <div className="space-y-2 p-4">
      {quotes.map((quote) => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          clientInfos={clientInfos}
          onEditClick={onEditClick}
          onDeleteQuote={onDeleteQuote}
        />
      ))}
    </div>
  );
};
