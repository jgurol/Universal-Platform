
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';
import { resolveBillingAddress, resolveServiceAddress } from './helpers/addressResolver';
import { renderBillingInfo } from './sections/billingInfo';
import { renderServiceAddress } from './sections/serviceAddress';
import { renderContactInfo } from './sections/contactInfo';

export const addClientInfo = (doc: jsPDF, context: PDFGenerationContext): number => {
  const { quote, clientInfo } = context;
  
  console.log('PDF clientInfo.ts - Starting addClientInfo with:', {
    quoteId: quote.id,
    quoteBillingAddress: quote.billingAddress,
    quoteServiceAddress: quote.serviceAddress,
    hasClientInfo: !!clientInfo,
    hasPrimaryContact: !!context.primaryContact
  });
  
  if (!clientInfo) {
    console.log('PDF clientInfo.ts - No clientInfo provided, returning early');
    return 105;
  }
  
  // Column positions - narrower margins, more centered service column
  const billingCol = 10;
  const serviceCol = 90;
  
  // Section headers
  let yPos = 85;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Billing Information', billingCol, yPos);
  
  // Resolve service address to determine the right column label
  const resolvedServiceAddress = resolveServiceAddress(context, resolveBillingAddress(context));
  const rightColumnLabel = resolvedServiceAddress && resolvedServiceAddress.trim() !== '' ? 'Shipping Address' : 'Service Address';
  doc.text(rightColumnLabel, serviceCol, yPos);
  
  // Underlines
  doc.setDrawColor(200, 200, 200);
  doc.line(billingCol, yPos + 2, billingCol + 45, yPos + 2);
  doc.line(serviceCol, yPos + 2, serviceCol + 45, yPos + 2);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Resolve addresses
  const billingAddress = resolveBillingAddress(context);
  const serviceAddress = resolveServiceAddress(context, billingAddress);
  
  // Render sections
  renderBillingInfo(doc, context, yPos, billingAddress, billingCol);
  renderServiceAddress(doc, context, yPos, serviceAddress, serviceCol);
  
  // Add quote date and created date below addresses
  yPos += 25; // Move down from address sections
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Add quote date on left column
  doc.text(`Quote Date: ${quote.date}`, billingCol, yPos);
  
  // Add created date on right column if available
  if (quote.createdAt) {
    const createdDate = new Date(quote.createdAt).toLocaleDateString();
    doc.text(`Created: ${createdDate}`, serviceCol, yPos);
  }
  
  renderContactInfo(doc, context, yPos + 8, billingCol, serviceCol);
  
  console.log('PDF clientInfo.ts - Completed addClientInfo, returning Y position:', 125);
  return 125; // Reduced from 145 to just 2 lines separation
};
