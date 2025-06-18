
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

  // Update form when quote changes - Fixed description handling
  useEffect(() => {
    if (quote && open) {
      console.log('[useQuoteForm] Initializing form with quote data:', {
        id: quote.id,
        description: quote.description,
        clientId: quote.clientId,
        clientInfoId: quote.clientInfoId
      });
      
      setClientId(quote.clientId);
      setClientInfoId(quote.clientInfoId || "");
      setDate(quote.date);
      setDescription(quote.description || "");
      setQuoteMonth(quote.quoteMonth || "");
      setQuoteYear(quote.quoteYear || "");
      setStatus(quote.status || "pending");
      setExpiresAt(quote.expiresAt || "");
      setNotes(quote.notes || "");
      setCommissionOverride(quote.commissionOverride?.toString() || "");

      console.log('[useQuoteForm] Description state set to:', quote.description);
    }
  }, [quote, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      console.log('[useQuoteForm] Dialog closed, resetting form');
      setClientId("");
      setClientInfoId("");
      setDate("");
      setDescription("");
      setQuoteNumber("");
      setQuoteMonth("");
      setQuoteYear("");
      setStatus("pending");
      setExpiresAt("");
      setNotes("");
      setCommissionOverride("");
      setQuoteItems([]);
    }
  }, [open]);

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
    quoteItems,
    setQuoteItems
  };
};
