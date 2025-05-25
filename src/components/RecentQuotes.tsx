
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { AddQuoteDialog } from "@/components/AddQuoteDialog";
import { EditQuoteDialog } from "@/components/EditQuoteDialog";
import { QuoteHeader } from "@/components/QuoteHeader";
import { QuoteTable } from "@/components/QuoteTable";
import { QuoteEmptyState } from "@/components/QuoteEmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface RecentQuotesProps {
  quotes: Quote[];
  clients: Client[];
  clientInfos: ClientInfo[];
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  associatedAgentId?: string | null;
}

export const RecentQuotes = ({ 
  quotes, 
  clients, 
  clientInfos,
  onAddQuote, 
  onUpdateQuote,
  onDeleteQuote,
  associatedAgentId
}: RecentQuotesProps) => {
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [isEditQuoteOpen, setIsEditQuoteOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const { isAdmin, user } = useAuth();

  // Function to handle editing a quote - only for admins
  const handleEditClick = (quote: Quote) => {
    if (!isAdmin) return;
    setCurrentQuote(quote);
    setIsEditQuoteOpen(true);
  };

  // Function to generate next quote number
  const generateNextQuoteNumber = async (): Promise<string> => {
    if (!user) return "3500";
    
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('quote_number')
        .eq('user_id', user.id)
        .not('quote_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last quote number:', error);
        return "3500";
      }

      let nextNumber = 3500; // Start from 3500 instead of 1
      if (data && data.length > 0 && data[0].quote_number) {
        const lastNumber = parseInt(data[0].quote_number);
        if (!isNaN(lastNumber)) {
          nextNumber = Math.max(lastNumber + 1, 3500); // Ensure we never go below 3500
        }
      }
      
      return nextNumber.toString();
    } catch (err) {
      console.error('Error generating quote number:', err);
      return "3500";
    }
  };

  // Function to handle copying a quote - only for admins
  const handleCopyQuote = async (quote: Quote) => {
    if (!isAdmin) return;
    
    // Generate proper quote number
    const newQuoteNumber = await generateNextQuoteNumber();
    
    // Create a new quote based on the existing one
    const newQuote: Omit<Quote, "id"> = {
      clientId: quote.clientId,
      clientName: quote.clientName,
      companyName: quote.companyName,
      amount: quote.amount,
      date: new Date().toISOString().split('T')[0], // Set to today's date
      description: `Copy of ${quote.description || 'Quote'}`,
      status: 'pending', // Reset status to pending
      clientInfoId: quote.clientInfoId,
      clientCompanyName: quote.clientCompanyName,
      commissionOverride: quote.commissionOverride,
      notes: quote.notes,
      quoteItems: quote.quoteItems || [],
      quoteNumber: newQuoteNumber, // Use properly generated quote number
      quoteMonth: quote.quoteMonth,
      quoteYear: quote.quoteYear,
      expiresAt: quote.expiresAt
    };
    
    onAddQuote(newQuote);
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <QuoteHeader
            quoteCount={quotes?.length || 0}
            onAddQuote={() => setIsAddQuoteOpen(true)}
          />
        </CardHeader>
        <CardContent className="p-0">
          {!quotes || quotes.length === 0 ? (
            <div className="p-6">
              <QuoteEmptyState associatedAgentId={associatedAgentId} />
            </div>
          ) : (
            <QuoteTable
              quotes={quotes}
              clientInfos={clientInfos}
              onEditClick={isAdmin ? handleEditClick : undefined}
              onDeleteQuote={onDeleteQuote}
              onUpdateQuote={onUpdateQuote}
              onCopyQuote={isAdmin ? handleCopyQuote : undefined}
            />
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <AddQuoteDialog
            open={isAddQuoteOpen}
            onOpenChange={setIsAddQuoteOpen}
            onAddQuote={onAddQuote}
            clients={clients}
            clientInfos={clientInfos}
          />

          <EditQuoteDialog
            quote={currentQuote}
            open={isEditQuoteOpen}
            onOpenChange={setIsEditQuoteOpen}
            onUpdateQuote={onUpdateQuote}
            clients={clients}
            clientInfos={clientInfos}
          />
        </>
      )}
    </>
  );
};
