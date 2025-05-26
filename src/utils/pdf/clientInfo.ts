
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
    return 115;
  }
  
  // Billing Information and Service Address sections
  let yPos = 115;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 110, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Resolve addresses
  const billingAddress = resolveBillingAddress(context);
  const serviceAddress = resolveServiceAddress(context, billingAddress);
  
  // Render sections
  renderBillingInfo(doc, context, yPos, billingAddress);
  
  const rightColYPos = yPos;
  renderServiceAddress(doc, context, rightColYPos, serviceAddress);
  
  renderContactInfo(doc, context, yPos, rightColYPos);
  
  console.log('PDF clientInfo.ts - Completed addClientInfo, returning Y position:', 185);
  return 185; // Return Y position for next section
};
