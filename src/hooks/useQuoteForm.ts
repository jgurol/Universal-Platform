
import { useState, useEffect } from "react";
import { Quote } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useQuoteForm = (quote: Quote | null, open: boolean) => {
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteMonth, setQuoteMonth] = useState("");
  const [quoteYear, setQuoteYear] = useState("");
  const [status, setStatus] = useState("pending");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [term, setTerm] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const { user } = useAuth();

  // Generate next version number when quote changes
  useEffect(() => {
    const generateNextVersionNumber = async () => {
      if (quote && user && open) {
        try {
          const baseQuoteNumber = quote.quoteNumber?.split('.')[0];
          
          if (!baseQuoteNumber) return;
          
          const { data, error } = await supabase
            .from('quotes')
            .select('quote_number')
            .eq('user_id', user.id)
            .not('quote_number', 'is', null)
            .like('quote_number', `${baseQuoteNumber}.%`)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching quote versions:', error);
            setQuoteNumber(`${baseQuoteNumber}.1`);
            return;
          }

          let nextVersion = 1;
          if (data && data.length > 0) {
            const versions = data
              .map(q => q.quote_number)
              .filter(qn => qn && qn.includes('.'))
              .map(qn => {
                const versionPart = qn.split('.')[1];
                return versionPart ? parseInt(versionPart) : 0;
              })
              .filter(v => !isNaN(v));
            
            if (versions.length > 0) {
              nextVersion = Math.max(...versions) + 1;
            }
          }
          
          setQuoteNumber(`${baseQuoteNumber}.${nextVersion}`);
        } catch (err) {
          console.error('Error generating version number:', err);
          const baseQuoteNumber = quote.quoteNumber?.split('.')[0] || "3500";
          setQuoteNumber(`${baseQuoteNumber}.1`);
        }
      }
    };

    generateNextVersionNumber();
  }, [quote, user, open]);

  // Add debugging effect to fetch fresh quote data from database
  useEffect(() => {
    const fetchQuoteFromDatabase = async () => {
      if (quote && quote.id && open) {
        console.log('[useQuoteForm] Fetching fresh quote data from database for quote ID:', quote.id);
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', quote.id)
            .single();

          if (error) {
            console.error('[useQuoteForm] Error fetching quote from database:', error);
            return;
          }

          console.log('[useQuoteForm] Fresh quote data from database:', {
            id: data.id,
            term: data.term,
            description: data.description,
            quote_number: data.quote_number,
            status: data.status
          });
          
          // Compare with quote prop
          console.log('[useQuoteForm] Comparing database vs prop:', {
            databaseTerm: data.term,
            propTerm: quote.term,
            areEqual: data.term === quote.term
          });

          // If the database term is different from the prop, use the database value
          if (data.term !== quote.term) {
            console.log('[useQuoteForm] Using database term value:', data.term);
            setTerm(data.term || "");
          }

        } catch (err) {
          console.error('[useQuoteForm] Error in database fetch:', err);
        }
      }
    };

    fetchQuoteFromDatabase();
  }, [quote?.id, open]);

  // Update form when quote changes - ensuring term is properly initialized
  useEffect(() => {
    if (quote && open) {
      console.log('[useQuoteForm] Initializing form with quote data:', {
        term: quote.term,
        termType: typeof quote.term,
        termLength: quote.term?.length,
        description: quote.description,
        clientId: quote.clientId,
        quoteId: quote.id,
        fullQuoteObject: quote
      });
      
      setClientId(quote.clientId || "");
      setClientInfoId(quote.clientInfoId || "");
      setDate(quote.date);
      setDescription(quote.description || "");
      setQuoteMonth(quote.quoteMonth || "");
      setQuoteYear(quote.quoteYear || "");
      setStatus(quote.status || "pending");
      setExpiresAt(quote.expiresAt || "");
      setNotes(quote.notes || "");
      setCommissionOverride(quote.commissionOverride?.toString() || "");
      
      // Ensure term is properly set from quote data with additional debugging
      const quoteTerm = quote.term || "";
      console.log('[useQuoteForm] Raw quote.term value:', quote.term);
      console.log('[useQuoteForm] Processed quoteTerm:', quoteTerm);
      console.log('[useQuoteForm] Setting term state to:', quoteTerm);
      setTerm(quoteTerm);
      
      // Add a small delay to ensure state is updated and log the result
      setTimeout(() => {
        console.log('[useQuoteForm] Term state after setting:', quoteTerm);
      }, 100);
    } else {
      // Reset form when dialog closes
      console.log('[useQuoteForm] Resetting form - dialog closed or no quote');
      setTerm("");
    }
  }, [quote, open]);

  // Add a separate effect to track term changes
  useEffect(() => {
    console.log('[useQuoteForm] Term state changed to:', term);
  }, [term]);

  return {
    clientId,
    setClientId,
    clientInfoId,
    setClientInfoId,  
    date,
    setDate,
    description,
    setDescription,
    quoteNumber,
    setQuoteNumber,
    quoteMonth,
    setQuoteMonth,
    quoteYear,
    setQuoteYear,
    status,
    setStatus,
    expiresAt,
    setExpiresAt,
    notes,
    setNotes,
    commissionOverride,
    setCommissionOverride,
    term,
    setTerm,
    quoteItems,
    setQuoteItems
  };
};
