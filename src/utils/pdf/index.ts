
import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/types/index';
import { loadSettingsFromDatabase } from './settingsLoader';
import { setupDocument, addAgreementDetailsBox, addStatusIndicator } from './documentSetup';
import { addCompanyInfo } from './companyInfo';
import { addClientInfo } from './clientInfo';
import { addQuoteItems } from './quoteItems';
import { addTemplateContent, addNotes } from './templateContent';
import { fetchAcceptanceDetails, addDigitalAcceptanceEvidence } from './acceptanceEvidence';
import { PDFGenerationContext } from './types';

export const generateQuotePDF = async (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  // Enhanced debugging for approval status
  console.log('PDF Generation - Starting PDF generation for quote:', quote.id);
  console.log('PDF Generation - Quote status:', quote.status);
  console.log('PDF Generation - Quote addresses DEBUG:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    quoteObject: quote
  });
  
  // Log the entire quote object to see what's actually there
  console.log('PDF Generation - Full quote object:', JSON.stringify(quote, null, 2));
  
  // More comprehensive approval check
  const isApproved = quote.status === 'approved' || 
                     quote.status === 'accepted' ||
                     (quote as any).acceptanceStatus === 'accepted' ||
                     !!(quote as any).accepted_at ||
                     !!(quote as any).acceptedBy;
  
  console.log('PDF Generation - Is quote approved?', isApproved);
  
  // Load business information and acceptance details
  const businessSettings = await loadSettingsFromDatabase();
  const acceptanceDetails = isApproved ? await fetchAcceptanceDetails(quote.id) : null;
  
  // Create PDF generation context
  const context: PDFGenerationContext = {
    quote,
    clientInfo,
    quoteItems: quote.quoteItems || [],
    salespersonName,
    businessSettings,
    acceptanceDetails: acceptanceDetails || undefined,
    isApproved
  };
  
  console.log('PDF Generation - Context created with addresses:', {
    billingAddress: context.quote.billingAddress,
    serviceAddress: context.quote.serviceAddress,
    contextQuote: context.quote
  });
  
  // Setup document
  const { doc } = await setupDocument(context);
  
  // Add document sections
  addCompanyInfo(doc, context);
  addAgreementDetailsBox(doc, context);
  addStatusIndicator(doc, context);
  
  const clientInfoEndY = addClientInfo(doc, context);
  const quoteItemsEndY = await addQuoteItems(doc, context, clientInfoEndY);
  const templateEndY = await addTemplateContent(doc, context, quoteItemsEndY);
  const notesEndY = addNotes(doc, context, templateEndY);
  
  // Add digital acceptance evidence if approved
  addDigitalAcceptanceEvidence(doc, context, notesEndY);
  
  return doc;
};
