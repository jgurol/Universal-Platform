
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';
import { formatAddress } from './addressFormatting';

export const addClientInfo = (doc: jsPDF, context: PDFGenerationContext): number => {
  const { quote, clientInfo } = context;
  
  if (!clientInfo) return 70;
  
  console.log('PDF Generation - Client Info Debug:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    clientAddress: clientInfo.address
  });
  
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
  const billingAddress = quote.billingAddress || clientInfo.address;
  console.log('PDF Generation - Using billing address:', billingAddress);
  
  if (billingAddress) {
    const formattedBilling = formatAddress(billingAddress);
    if (formattedBilling) {
      doc.text(formattedBilling.street, 20, yPos + 7);
      if (formattedBilling.cityStateZip) {
        doc.text(formattedBilling.cityStateZip, 20, yPos + 14);
      }
    }
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
    console.log('PDF Generation - Using quote service address:', finalServiceAddress);
  } else if (quote.billingAddress && quote.billingAddress.trim() !== '') {
    finalServiceAddress = quote.billingAddress;
    console.log('PDF Generation - Using billing address as service address:', finalServiceAddress);
  } else if (clientInfo.address && clientInfo.address.trim() !== '') {
    finalServiceAddress = clientInfo.address;
    console.log('PDF Generation - Using client address as service address:', finalServiceAddress);
  }
  
  console.log('PDF Generation - Final service address:', finalServiceAddress);
  
  if (finalServiceAddress) {
    const formattedService = formatAddress(finalServiceAddress);
    if (formattedService) {
      doc.text(formattedService.street, 110, rightColYPos + 7 + rightYOffset);
      if (formattedService.cityStateZip) {
        doc.text(formattedService.cityStateZip, 110, rightColYPos + 14 + rightYOffset);
      }
    }
  } else {
    console.log('PDF Generation - No service address found, showing fallback message');
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
  
  return 145; // Return Y position for next section
};
