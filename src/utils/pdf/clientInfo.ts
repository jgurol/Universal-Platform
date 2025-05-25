
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';
import { formatAddress } from './addressFormatting';

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
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 110, yPos);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos + 2, 85, yPos + 2);
  doc.line(110, yPos + 2, 175, yPos + 2);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Billing info (left column)
  doc.setFont('helvetica', 'bold');
  doc.text(clientInfo.company_name, 20, yPos);
  doc.setFont('helvetica', 'normal');
  
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, 20, yPos + 7);
    yPos += 7;
  }
  
  // Determine billing address - prioritize quote.billingAddress
  let billingAddress = quote.billingAddress;
  if (!billingAddress || billingAddress.trim() === '') {
    billingAddress = clientInfo.address;
  }
  
  console.log('PDF clientInfo.ts - Billing address determination:', {
    quoteBillingAddress: quote.billingAddress,
    clientInfoAddress: clientInfo.address,
    finalBillingAddress: billingAddress
  });
  
  if (billingAddress && billingAddress.trim() !== '') {
    const formattedBilling = formatAddress(billingAddress);
    console.log('PDF clientInfo.ts - Formatted billing address:', formattedBilling);
    if (formattedBilling) {
      doc.text(formattedBilling.street, 20, yPos + 7);
      if (formattedBilling.cityStateZip) {
        doc.text(formattedBilling.cityStateZip, 20, yPos + 14);
      }
    }
  } else {
    console.log('PDF clientInfo.ts - No billing address found, showing fallback');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No billing address specified', 20, yPos + 7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }
  
  if (clientInfo.phone) {
    doc.text(`Tel: ${clientInfo.phone}`, 20, yPos + 28);
  }
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, 20, yPos + 35);
  }
  
  // Service address (right column)
  const rightColYPos = 78;
  doc.setFont('helvetica', 'bold');
  doc.text(clientInfo.company_name, 110, rightColYPos);
  doc.setFont('helvetica', 'normal');
  
  let rightYOffset = 0;
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, 110, rightColYPos + 7);
    rightYOffset = 7;
  }
  
  // Determine service address - prioritize quote.serviceAddress, fallback to billing, then client address
  let finalServiceAddress = null;
  
  if (quote.serviceAddress && quote.serviceAddress.trim() !== '') {
    finalServiceAddress = quote.serviceAddress;
    console.log('PDF clientInfo.ts - Using quote service address:', finalServiceAddress);
  } else if (billingAddress && billingAddress.trim() !== '') {
    finalServiceAddress = billingAddress;
    console.log('PDF clientInfo.ts - Using billing address as service address:', finalServiceAddress);
  } else if (clientInfo.address && clientInfo.address.trim() !== '') {
    finalServiceAddress = clientInfo.address;
    console.log('PDF clientInfo.ts - Using client address as service address:', finalServiceAddress);
  }
  
  console.log('PDF clientInfo.ts - Final service address determination:', {
    quoteServiceAddress: quote.serviceAddress,
    billingAddress: billingAddress,
    clientInfoAddress: clientInfo.address,
    finalServiceAddress: finalServiceAddress
  });
  
  if (finalServiceAddress && finalServiceAddress.trim() !== '') {
    const formattedService = formatAddress(finalServiceAddress);
    console.log('PDF clientInfo.ts - Formatted service address:', formattedService);
    if (formattedService) {
      doc.text(formattedService.street, 110, rightColYPos + 7 + rightYOffset);
      if (formattedService.cityStateZip) {
        doc.text(formattedService.cityStateZip, 110, rightColYPos + 14 + rightYOffset);
      }
    }
  } else {
    console.log('PDF clientInfo.ts - No service address found, showing fallback message');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No service address specified', 110, rightColYPos + 7 + rightYOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }
  
  if (clientInfo.phone) {
    doc.text(`Tel: ${clientInfo.phone}`, 110, rightColYPos + 28);
  }
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, 110, rightColYPos + 35);
  }
  
  console.log('PDF clientInfo.ts - Completed addClientInfo, returning Y position:', 145);
  return 145; // Return Y position for next section
};
