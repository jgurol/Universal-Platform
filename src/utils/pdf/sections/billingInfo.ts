
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';
import { formatAddress } from '../addressFormatting';

export const renderBillingInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, billingAddress: string | null): void => {
  const { clientInfo } = context;
  
  if (!clientInfo) return;
  
  // Billing info (left column)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Ensure black text
  doc.text(clientInfo.company_name, 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // Reset to black for normal text
  
  let currentYPos = yPos;
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, 20, currentYPos + 7);
    currentYPos += 7;
  }
  
  if (billingAddress && billingAddress.trim() !== '') {
    console.log('PDF billingInfo - Processing billing address:', billingAddress);
    const formattedBilling = formatAddress(billingAddress);
    console.log('PDF billingInfo - Formatted billing address result:', formattedBilling);
    
    if (formattedBilling) {
      console.log('PDF billingInfo - About to add billing street. Doc object:', typeof doc);
      console.log('PDF billingInfo - Doc.text function:', typeof doc.text);
      console.log('PDF billingInfo - Billing street text:', formattedBilling.street);
      console.log('PDF billingInfo - Billing street Y position:', currentYPos + 7);
      
      try {
        doc.setTextColor(0, 0, 0); // Explicitly set black text
        doc.setFont('helvetica', 'normal');
        doc.text(formattedBilling.street, 20, currentYPos + 7);
        console.log('PDF billingInfo - Successfully added billing street');
      } catch (error) {
        console.error('PDF billingInfo - Error adding billing street:', error);
      }
      
      if (formattedBilling.cityStateZip) {
        console.log('PDF billingInfo - About to add billing cityStateZip:', formattedBilling.cityStateZip);
        try {
          doc.setTextColor(0, 0, 0); // Explicitly set black text
          doc.text(formattedBilling.cityStateZip, 20, currentYPos + 14);
          console.log('PDF billingInfo - Successfully added billing cityStateZip');
        } catch (error) {
          console.error('PDF billingInfo - Error adding billing cityStateZip:', error);
        }
      } else {
        console.log('PDF billingInfo - No cityStateZip for billing address');
      }
    } else {
      console.log('PDF billingInfo - formatAddress returned null for billing');
    }
  } else {
    console.log('PDF billingInfo - No billing address found, showing fallback');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No billing address specified', 20, currentYPos + 7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }
};
