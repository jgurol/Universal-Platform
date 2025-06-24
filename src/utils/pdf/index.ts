
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
  console.log('PDF Generation - Quote acceptedAt:', quote.acceptedAt);
  
  // More comprehensive approval check - check both status and acceptedAt
  const isApproved = quote.status === 'approved' || 
                     quote.status === 'accepted' ||
                     !!(quote.acceptedAt);
  
  console.log('PDF Generation - Is quote approved?', isApproved);
  
  // Load business information and acceptance details
  const businessSettings = await loadSettingsFromDatabase();
  let acceptanceDetails = null;
  
  // Only fetch acceptance details if quote is approved
  if (isApproved) {
    console.log('PDF Generation - Fetching acceptance details for approved quote');
    acceptanceDetails = await fetchAcceptanceDetails(quote.id);
    console.log('PDF Generation - Acceptance details fetched:', !!acceptanceDetails);
    if (acceptanceDetails) {
      console.log('PDF Generation - Acceptance client name:', acceptanceDetails.clientName);
      console.log('PDF Generation - Acceptance has signature:', !!acceptanceDetails.signatureData);
    }
  }
  
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
  const finalY = addDigitalAcceptanceEvidence(doc, context, notesEndY);
  
  console.log('PDF Generation - Final PDF generation completed, final Y position:', finalY);
  
  return doc;
};
