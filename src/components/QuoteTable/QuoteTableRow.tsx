
import { useState, useEffect } from "react";
import { Quote, ClientInfo } from "@/pages/Index";
import { TableRow } from "@/components/ui/table";
import { EmailQuoteDialog } from "@/components/EmailQuoteDialog";
import { QuoteTableCells } from "./QuoteTableCells";
import { useAuth } from "@/context/AuthContext";

interface QuoteTableRowProps {
  quote: Quote;
  clientInfos: ClientInfo[];
  agentMapping: Record<string, string>;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
}

export const QuoteTableRow = ({
  quote,
  clientInfos,
  agentMapping,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote,
  onUnarchiveQuote
}: QuoteTableRowProps) => {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [quoteOwnerName, setQuoteOwnerName] = useState<string>('Loading...');
  const { user } = useAuth();

  // Use the profile data that's already been fetched and attached to the quote
  useEffect(() => {
    console.log('QuoteTableRow - Starting profile resolution for quote ID:', quote.id);
    console.log('QuoteTableRow - Quote user_id:', quote.user_id);
    
    // Check if we have user profile data from the joined query
    const quoteWithProfile = quote as any;
    if (quoteWithProfile.user_profile) {
      console.log('QuoteTableRow - Found attached user profile:', quoteWithProfile.user_profile);
      const profile = quoteWithProfile.user_profile;
      if (profile.full_name && profile.full_name.trim() !== '') {
        console.log('QuoteTableRow - Using attached profile full_name:', profile.full_name);
        setQuoteOwnerName(profile.full_name);
      } else if (profile.email) {
        console.log('QuoteTableRow - Using attached profile email:', profile.email);
        setQuoteOwnerName(profile.email);
      } else {
        console.log('QuoteTableRow - Profile data incomplete, using fallback');
        setQuoteOwnerName('Sales Team');
      }
    } else {
      console.log('QuoteTableRow - No attached profile data, using fallback');
      // Fallback for current user
      if (quote.user_id === user?.id && user?.email) {
        console.log('QuoteTableRow - Using current user email as fallback:', user.email);
        setQuoteOwnerName(user.email.split('@')[0]);
      } else {
        setQuoteOwnerName('Sales Team');
      }
    }
  }, [quote.user_id, quote.id, user]);

  const clientInfo = clientInfos.find(ci => ci.id === quote.clientInfoId);

  const handleStatusUpdate = (newStatus: string) => {
    if (onUpdateQuote) {
      onUpdateQuote({
        ...quote,
        status: newStatus
      });
    }
  };

  console.log('QuoteTableRow - Final render with quoteOwnerName:', quoteOwnerName);

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <QuoteTableCells
          quote={quote}
          clientInfo={clientInfo}
          salespersonName={quoteOwnerName}
          onEditClick={onEditClick}
          onDeleteQuote={onDeleteQuote}
          onCopyQuote={onCopyQuote}
          onEmailClick={() => setIsEmailDialogOpen(true)}
          onStatusUpdate={handleStatusUpdate}
          onUnarchiveQuote={onUnarchiveQuote}
        />
      </TableRow>

      <EmailQuoteDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        quote={quote}
        clientInfo={clientInfo}
        salespersonName={quoteOwnerName}
      />
    </>
  );
};
