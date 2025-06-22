
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';
import { formatAddress } from '../addressFormatting';

export const renderBillingInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, billingAddress: string | null, xPos: number = 20): void => {
  const { clientInfo, primaryContact } = context;
  
  if (!clientInfo) return;
  
  // Billing info (first column)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(clientInfo.company_name, xPos, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  let currentYPos = yPos;
  if (primaryContact) {
    const contactName = `${primaryContact.first_name} ${primaryContact.last_name}`;
    doc.text(contactName, xPos, currentYPos + 4);
    currentYPos += 4;
  }
  
  if (billingAddress && billingAddress.trim() !== '') {
    console.log('PDF billingInfo - Processing billing address:', billingAddress);
    const formattedBilling = formatAddress(billingAddress);
    console.log('PDF billingInfo - Formatted billing address result:', formattedBilling);
    
    if (formattedBilling) {
      try {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(formattedBilling.street, xPos, currentYPos + 4);
        console.log('PDF billingInfo - Successfully added billing street');
        
        if (formattedBilling.cityStateZip) {
          doc.setTextColor(0, 0, 0);
          doc.text(formattedBilling.cityStateZip, xPos, currentYPos + 8);
          doc.text('United States', xPos, currentYPos + 12);
          console.log('PDF billingInfo - Successfully added billing cityStateZip');
        }
      } catch (error) {
        console.error('PDF billingInfo - Error adding billing address:', error);
      }
    }
  } else {
    console.log('PDF billingInfo - No billing address found, showing fallback');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No billing address specified', xPos, currentYPos + 4);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }
};
