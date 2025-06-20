
import { useState, useEffect } from "react";
import { Quote, ClientInfo } from "@/pages/Index";
import { TableRow } from "@/components/ui/table";
import { EmailQuoteDialog } from "@/components/EmailQuoteDialog";
import { QuoteTableCells } from "./QuoteTableCells";
import { supabase } from "@/integrations/supabase/client";
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

  // Fetch the quote owner's name from the profiles table
  useEffect(() => {
    const fetchQuoteOwnerName = async () => {
      console.log('QuoteTableRow - Starting fetch for quote ID:', quote.id);
      console.log('QuoteTableRow - Quote user_id:', quote.user_id);
      console.log('QuoteTableRow - Current auth user:', user?.id);
      
      // Determine which user_id to use for lookup
      const lookupUserId = quote.user_id || user?.id;
      
      if (!lookupUserId) {
        console.log('QuoteTableRow - No user_id found (quote or current user), using fallback');
        setQuoteOwnerName('Sales Team');
        return;
      }

      try {
        console.log('QuoteTableRow - Querying profiles table for user_id:', lookupUserId);
        
        // First try to get the profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', lookupUserId)
          .maybeSingle(); // Use maybeSingle to avoid errors when no record found
        
        console.log('QuoteTableRow - Profile query result:', { profile, error });
        
        if (error) {
          console.error('QuoteTableRow - Error fetching profile:', error);
          // If there's an error, try to get user info from auth if it's the current user
          if (lookupUserId === user?.id && user?.email) {
            console.log('QuoteTableRow - Using current user email as fallback:', user.email);
            setQuoteOwnerName(user.email.split('@')[0]);
          } else {
            setQuoteOwnerName('Sales Team');
          }
          return;
        }
        
        if (profile?.full_name && profile.full_name.trim() !== '') {
          console.log('QuoteTableRow - Setting quote owner name to full_name:', profile.full_name);
          setQuoteOwnerName(profile.full_name);
        } else if (profile?.email) {
          console.log('QuoteTableRow - Setting quote owner name to email:', profile.email);
          setQuoteOwnerName(profile.email);
        } else {
          console.log('QuoteTableRow - No profile data found, checking if current user');
          // If no profile found but this is the current user, use their auth info
          if (lookupUserId === user?.id) {
            if (user?.email) {
              console.log('QuoteTableRow - Using current user auth email:', user.email);
              setQuoteOwnerName(user.email.split('@')[0]);
            } else {
              console.log('QuoteTableRow - No current user email, using Sales Team');
              setQuoteOwnerName('Sales Team');
            }
          } else {
            console.log('QuoteTableRow - Not current user, using Sales Team fallback');
            setQuoteOwnerName('Sales Team');
          }
        }
      } catch (error) {
        console.error('QuoteTableRow - Error fetching quote owner name:', error);
        setQuoteOwnerName('Sales Team');
      }
    };

    fetchQuoteOwnerName();
  }, [quote.user_id, user]);

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
