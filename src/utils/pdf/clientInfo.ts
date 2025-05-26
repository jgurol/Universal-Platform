
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
    clientInfoAddress: clientInfo?.address,
    hasClientInfo: !!clientInfo
  });
  
  if (!clientInfo) {
    console.log('PDF clientInfo.ts - No clientInfo provided, returning early');
    return 70;
  }
  
  // Billing Information and Service Address sections
  let yPos = 70;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Ensure black text
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 110, yPos);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos + 2, 85, yPos + 2);
  doc.line(110, yPos + 2, 175, yPos + 2);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // Ensure black text for content
  
  // Resolve addresses
  const billingAddress = resolveBillingAddress(context);
  const serviceAddress = resolveServiceAddress(context, billingAddress);
  
  // Render sections
  renderBillingInfo(doc, context, yPos, billingAddress);
  
  const rightColYPos = 78;
  renderServiceAddress(doc, context, rightColYPos, serviceAddress);
  
  renderContactInfo(doc, context, yPos, rightColYPos);
  
  console.log('PDF clientInfo.ts - Completed addClientInfo, returning Y position:', 145);
  return 145; // Return Y position for next section
};
