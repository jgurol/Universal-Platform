
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { AddQuoteDialog } from "@/components/AddQuoteDialog";
import { EditQuoteDialog } from "@/components/EditQuoteDialog";
import { QuoteHeader } from "@/components/QuoteHeader";
import { QuoteTable } from "@/components/QuoteTable";
import { QuoteEmptyState } from "@/components/QuoteEmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

interface RecentQuotesProps {
  quotes: Quote[];
  clients: Client[];
  clientInfos: ClientInfo[];
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
  onPermanentlyDeleteQuote?: (quoteId: string) => void;
  associatedAgentId?: string | null;
}

export const RecentQuotes = ({ 
  quotes, 
  clients, 
  clientInfos,
  onAddQuote, 
  onUpdateQuote,
  onDeleteQuote,
  onUnarchiveQuote,
  onPermanentlyDeleteQuote,
  associatedAgentId
}: RecentQuotesProps) => {
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [isEditQuoteOpen, setIsEditQuoteOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();

  // Debug log when clientInfos prop changes
  useEffect(() => {
    console.log('[RecentQuotes] Received clientInfos prop:', clientInfos.length, 'items');
    if (clientInfos.length > 0) {
      console.log('[RecentQuotes] Sample clientInfos:', clientInfos.slice(0, 3).map(c => ({ id: c.id, name: c.company_name })));
    }
  }, [clientInfos]);

  // Function to handle editing a quote - now available to all authenticated users
  const handleEditClick = (quote: Quote) => {
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

  // Function to handle copying a quote - now available to all authenticated users
  const handleCopyQuote = async (quote: Quote) => {
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
      expiresAt: quote.expiresAt,
      term: quote.term,
      billingAddress: quote.billingAddress,
      serviceAddress: quote.serviceAddress,
      templateId: quote.templateId,
      emailStatus: quote.emailStatus,
      acceptedBy: quote.acceptedBy,
      emailSentAt: quote.emailSentAt,
      emailOpened: quote.emailOpened,
      emailOpenedAt: quote.emailOpenedAt,
      emailOpenCount: quote.emailOpenCount,
      acceptedAt: quote.acceptedAt,
      commission: quote.commission,
      user_id: quote.user_id,
      archived: false
    };
    
    onAddQuote(newQuote);
  };

  // Filter quotes based on search term and archived status
  const filteredQuotes = quotes.filter(quote => {
    // Filter by archived status
    const archivedMatch = showArchived ? (quote as any).archived === true : !(quote as any).archived;
    
    if (!archivedMatch) return false;
    
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-archived"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked === true)}
            />
            <label
              htmlFor="show-archived"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show archived quotes
            </label>
          </div>
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
              ) : showArchived ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No archived quotes found.</p>
                </div>
              ) : (
                <QuoteEmptyState associatedAgentId={associatedAgentId} />
              )}
            </div>
          ) : (
            <QuoteTable
              quotes={filteredQuotes}
              clients={clients}
              clientInfos={clientInfos}
              onEditQuote={handleEditClick}
              onDeleteQuote={onDeleteQuote}
              onUpdateQuote={onUpdateQuote}
              onCopyQuote={handleCopyQuote}
              onUnarchiveQuote={onUnarchiveQuote}
              onPermanentlyDeleteQuote={onPermanentlyDeleteQuote}
            />
          )}
        </CardContent>
      </Card>

      {/* Allow both admins and agents to add quotes */}
      <AddQuoteDialog
        open={isAddQuoteOpen}
        onOpenChange={setIsAddQuoteOpen}
        onAddQuote={onAddQuote}
        clients={clients}
        clientInfos={clientInfos}
      />

      {/* Only admins can edit quotes */}
      <EditQuoteDialog
        quote={currentQuote}
        open={isEditQuoteOpen}
        onOpenChange={setIsEditQuoteOpen}
        onUpdateQuote={onUpdateQuote}
        clients={clients}
        clientInfos={clientInfos}
      />
    </>
  );
};
