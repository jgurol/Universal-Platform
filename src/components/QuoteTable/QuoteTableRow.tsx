
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

  // Fetch the quote owner's name from the profiles table or use the joined data
  useEffect(() => {
    const fetchQuoteOwnerName = async () => {
      console.log('QuoteTableRow - Starting fetch for quote ID:', quote.id);
      console.log('QuoteTableRow - Quote user_id:', quote.user_id);
      console.log('QuoteTableRow - Current auth user:', user?.id);
      
      // First check if we have user profile data from the joined query
      const quoteWithProfile = quote as any;
      if (quoteWithProfile.user_profile) {
        console.log('QuoteTableRow - Found joined user profile:', quoteWithProfile.user_profile);
        const profile = quoteWithProfile.user_profile;
        if (profile.full_name && profile.full_name.trim() !== '') {
          console.log('QuoteTableRow - Using joined profile full_name:', profile.full_name);
          setQuoteOwnerName(profile.full_name);
          return;
        } else if (profile.email) {
          console.log('QuoteTableRow - Using joined profile email:', profile.email);
          setQuoteOwnerName(profile.email);
          return;
        }
      }
      
      // Fallback to separate query if no joined data
      const lookupUserId = quote.user_id || user?.id;
      
      if (!lookupUserId) {
        console.log('QuoteTableRow - No user_id found, using fallback');
        setQuoteOwnerName('Sales Team');
        return;
      }

      try {
        console.log('QuoteTableRow - Querying profiles table for user_id:', lookupUserId);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', lookupUserId)
          .maybeSingle();
        
        console.log('QuoteTableRow - Profile query result:', { profile, error });
        
        if (error) {
          console.error('QuoteTableRow - Error fetching profile:', error);
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
