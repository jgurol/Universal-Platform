
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  companyName: string;
  amount: number;
  date: string;
  description?: string;
  status: string;
  clientInfoId?: string;
  clientCompanyName?: string;
  commissionOverride?: number;
  notes?: string;
  quoteNumber?: string;
  quoteMonth?: string;
  quoteYear?: string;
  term?: string;
  expiresAt?: string;
  acceptedAt?: string;
  commission?: number;
  archived?: boolean;
  billingAddress?: string;
  serviceAddress?: string;
  templateId?: string;
  emailStatus?: string;
  acceptedBy?: string;
  emailSentAt?: string;
  emailOpened?: boolean;
  emailOpenedAt?: string;
  emailOpenCount?: number;
  user_id?: string;
}

export const useQuoteData = (quoteId: string | undefined) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async () => {
    if (!quoteId) {
      setError('Invalid quote link. Please check the URL and try again.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching quote data for ID:', quoteId);

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error fetching quote:', quoteError);
        throw quoteError;
      }
      if (!quoteData) throw new Error('Quote not found');

      console.log('Quote data fetched:', quoteData);
      
      const transformedQuote: Quote = {
        id: quoteData.id,
        clientId: quoteData.client_id || '',
        clientName: '',
        companyName: '',
        amount: quoteData.amount,
        date: quoteData.date,
        description: quoteData.description,
        status: quoteData.status || 'pending',
        clientInfoId: quoteData.client_info_id,
        notes: quoteData.notes,
        quoteNumber: quoteData.quote_number,
        quoteMonth: quoteData.quote_month,
        quoteYear: quoteData.quote_year,
        term: (quoteData as any).term || '',
        expiresAt: quoteData.expires_at,
        commission: quoteData.commission,
        commissionOverride: quoteData.commission_override,
        billingAddress: quoteData.billing_address,
        serviceAddress: quoteData.service_address,
        templateId: quoteData.template_id,
        emailStatus: quoteData.email_status,
        acceptedBy: quoteData.accepted_by,
        emailSentAt: quoteData.email_sent_at,
        emailOpened: quoteData.email_opened,
        emailOpenedAt: quoteData.email_opened_at,
        emailOpenCount: quoteData.email_open_count,
        user_id: quoteData.user_id
      };
      
      setQuote(transformedQuote);

      // Check if quote is expired
      if (transformedQuote.expiresAt && new Date(transformedQuote.expiresAt) < new Date()) {
        setError('This quote has expired and can no longer be accepted.');
        setIsLoading(false);
        return;
      }

    } catch (err) {
      console.error('Error fetching quote data:', err);
      setError('Failed to load quote data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  return {
    quote,
    isLoading,
    error
  };
};
