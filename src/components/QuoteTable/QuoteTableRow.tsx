
import { useState, useEffect } from "react";
import { Quote, ClientInfo } from "@/pages/Index";
import { TableRow } from "@/components/ui/table";
import { EmailQuoteDialog } from "@/components/EmailQuoteDialog";
import { QuoteTableCells } from "./QuoteTableCells";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch the quote owner's name from the profiles table
  useEffect(() => {
    const fetchQuoteOwnerName = async () => {
      console.log('QuoteTableRow - Starting fetch for quote ID:', quote.id);
      console.log('QuoteTableRow - Quote user_id:', quote.user_id);
      
      if (!quote.user_id) {
        console.log('QuoteTableRow - No user_id found, using fallback');
        setQuoteOwnerName('Sales Team');
        return;
      }

      try {
        console.log('QuoteTableRow - Querying profiles table for user_id:', quote.user_id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', quote.user_id)
          .single();
        
        console.log('QuoteTableRow - Profile query result:', { profile, error });
        console.log('QuoteTableRow - Profile data:', profile);
        console.log('QuoteTableRow - Profile full_name:', profile?.full_name);
        console.log('QuoteTableRow - Profile email:', profile?.email);
        
        if (!error && profile?.full_name && profile.full_name.trim() !== '') {
          console.log('QuoteTableRow - Setting quote owner name to full_name:', profile.full_name);
          setQuoteOwnerName(profile.full_name);
        } else {
          console.log('QuoteTableRow - No full_name found, trying email fallback');
          // If no full_name, try to use email or fallback
          if (profile?.email) {
            console.log('QuoteTableRow - Setting quote owner name to email:', profile.email);
            setQuoteOwnerName(profile.email);
          } else {
            console.log('QuoteTableRow - No email either, using Sales Team fallback');
            setQuoteOwnerName('Sales Team');
          }
        }
      } catch (error) {
        console.error('QuoteTableRow - Error fetching quote owner name:', error);
        setQuoteOwnerName('Sales Team');
      }
    };

    fetchQuoteOwnerName();
  }, [quote.user_id]);

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
