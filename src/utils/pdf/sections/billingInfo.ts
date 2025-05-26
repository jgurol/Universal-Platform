
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';
import { formatAddress } from '../addressFormatting';

export const renderBillingInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, billingAddress: string | null): void => {
  const { clientInfo } = context;
  
  if (!clientInfo) return;
  
  let currentY = yPos;
  
  // Company name in bold
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(clientInfo.company_name, 20, currentY);
  currentY += 4;
  
  // Contact name
  if (clientInfo.contact_name) {
    doc.setFont('helvetica', 'normal');
    doc.text(clientInfo.contact_name, 20, currentY);
    currentY += 4;
  }
  
  if (billingAddress && billingAddress.trim() !== '') {
    console.log('PDF billingInfo - Processing billing address:', billingAddress);
    const formattedBilling = formatAddress(billingAddress);
    console.log('PDF billingInfo - Formatted billing address result:', formattedBilling);
    
    if (formattedBilling) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(formattedBilling.street, 20, currentY);
      currentY += 4;
      
      if (formattedBilling.cityStateZip) {
        doc.text(formattedBilling.cityStateZip, 20, currentY);
        currentY += 4;
      }
      
      // Add "United States" line
      doc.text('United States', 20, currentY);
      currentY += 6;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No billing address specified', 20, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    currentY += 6;
  }
  
  // Contact information
  if (clientInfo.phone) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Tel: ${clientInfo.phone}`, 20, currentY);
    currentY += 4;
  }
  
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, 20, currentY);
  }
};
