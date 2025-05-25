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
  const [searchTerm, setSearchTerm] = useState("");
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

  // Function to filter quotes based on search term
  const filteredQuotes = quotes.filter(quote => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in quote basic fields
    const matchesBasicFields = 
      quote.clientName?.toLowerCase().includes(searchLower) ||
      quote.description?.toLowerCase().includes(searchLower) ||
      quote.quoteNumber?.toLowerCase().includes(searchLower) ||
      quote.clientCompanyName?.toLowerCase().includes(searchLower) ||
      quote.notes?.toLowerCase().includes(searchLower);
    
    // Search in quote items
    const matchesQuoteItems = quote.quoteItems?.some(item => 
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.item?.name?.toLowerCase().includes(searchLower) ||
      item.item?.description?.toLowerCase().includes(searchLower) ||
      item.item?.sku?.toLowerCase().includes(searchLower)
    );
    
    return matchesBasicFields || matchesQuoteItems;
  });

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <QuoteHeader
            quoteCount={filteredQuotes?.length || 0}
            onAddQuote={() => setIsAddQuoteOpen(true)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardHeader>
        <CardContent className="p-0">
          {!filteredQuotes || filteredQuotes.length === 0 ? (
            <div className="p-6">
              {searchTerm ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No quotes found matching "{searchTerm}"</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <QuoteEmptyState associatedAgentId={associatedAgentId} />
              )}
            </div>
          ) : (
            <QuoteTable
              quotes={filteredQuotes}
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
