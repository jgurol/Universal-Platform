
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientInfo } from "@/types/index";

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
  quoteItems?: QuoteItem[];
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

interface QuoteItem {
  id: string;
  quote_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  address_id?: string;
  item?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    cost: number;
    sku?: string;
    charge_type?: string;
    category_id?: string;
    vendor_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
}

export const useAcceptQuoteData = (quoteId: string | undefined) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepted, setIsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateLoading, setTemplateLoading] = useState(false);

  const fetchQuoteData = async () => {
    if (!quoteId) {
      setError('Invalid quote link. Please check the URL and try again.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching quote data for ID:', quoteId);

      // Fetch quote data
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
      
      // Transform the database quote to match our Quote interface
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

      // Fetch template content if template_id exists
      if (transformedQuote.templateId) {
        setTemplateLoading(true);
        const { data: template, error: templateError } = await supabase
          .from('quote_templates')
          .select('content')
          .eq('id', transformedQuote.templateId)
          .single();

        if (!templateError && template) {
          setTemplateContent(template.content);
        }
        setTemplateLoading(false);
      }

      // Check if quote is already accepted
      const { data: acceptanceData, error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .select('accepted_at')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (acceptanceError) {
        console.error('Error checking acceptance:', acceptanceError);
      }

      if (acceptanceData) {
        console.log('Quote already accepted at:', acceptanceData.accepted_at);
        setIsAccepted(true);
        setAcceptedAt(acceptanceData.accepted_at);
        setIsLoading(false);
        return;
      }

      // Check if quote is expired
      if (transformedQuote.expiresAt && new Date(transformedQuote.expiresAt) < new Date()) {
        setError('This quote has expired and can no longer be accepted.');
        setIsLoading(false);
        return;
      }
      
      // Fetch quote items
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          item:items(*)
        `)
        .eq('quote_id', quoteId);

      if (itemsError) throw itemsError;
      
      const transformedItems: QuoteItem[] = (itemsData || []).map(item => ({
        ...item,
        charge_type: (item.charge_type === 'MRC' || item.charge_type === 'NRC') ? item.charge_type : 'NRC'
      }));
      
      setQuoteItems(transformedItems);

      // Fetch client info if available
      if (transformedQuote.clientInfoId) {
        const { data: clientData, error: clientError } = await supabase
          .from('client_info')
          .select('*')
          .eq('id', transformedQuote.clientInfoId)
          .single();

        if (!clientError && clientData) {
          const transformedClientInfo: ClientInfo = {
            id: clientData.id,
            user_id: clientData.user_id,
            company_name: clientData.company_name,
            notes: clientData.notes,
            revio_id: clientData.revio_id,
            agent_id: clientData.agent_id,
            created_at: clientData.created_at,
            updated_at: clientData.updated_at,
            commission_override: clientData.commission_override
          };
          
          setClientInfo(transformedClientInfo);

          // Fetch contacts for this client
          const { data: contactsData, error: contactsError } = await supabase
            .from('client_contacts')
            .select('*')
            .eq('client_info_id', clientData.id);

          if (!contactsError && contactsData) {
            setContacts(contactsData);
            const primary = contactsData.find(contact => contact.is_primary);
            if (primary) {
              setPrimaryContact(primary);
            }
          }
        }
      }

    } catch (err) {
      console.error('Error fetching quote data:', err);
      setError('Failed to load quote data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteData();
  }, [quoteId]);

  return {
    quote,
    quoteItems,
    clientInfo,
    contacts,
    primaryContact,
    isLoading,
    isAccepted,
    error,
    acceptedAt,
    templateContent,
    templateLoading,
    setIsAccepted,
    setAcceptedAt
  };
};
