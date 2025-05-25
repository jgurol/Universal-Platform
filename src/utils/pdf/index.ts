
import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/pages/Index';
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
  console.log('PDF Generation - Quote addresses:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress
  });
  
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
    salespersonName,
    businessSettings,
    acceptanceDetails: acceptanceDetails || undefined,
    isApproved
  };
  
  console.log('PDF Generation - Context created with addresses:', {
    billingAddress: context.quote.billingAddress,
    serviceAddress: context.quote.serviceAddress
  });
  
  // Setup document
  const { doc } = await setupDocument(context);
  
  // Add document sections
  addCompanyInfo(doc, context);
  addAgreementDetailsBox(doc, context);
  addStatusIndicator(doc, context);
  
  const clientInfoEndY = addClientInfo(doc, context);
  const quoteItemsEndY = addQuoteItems(doc, context, clientInfoEndY);
  const templateEndY = await addTemplateContent(doc, context, quoteItemsEndY);
  const notesEndY = addNotes(doc, context, templateEndY);
  
  // Add digital acceptance evidence if approved
  addDigitalAcceptanceEvidence(doc, context, notesEndY);
  
  return doc;
};
