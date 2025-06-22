
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';

export const renderContactInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, billingCol: number = 20, serviceCol: number = 67): void => {
  const { primaryContact } = context;
  
  if (!primaryContact) return;
  
  // Left column contact info
  if (primaryContact.phone) {
    console.log('PDF contactInfo - Adding phone at Y position:', yPos + 28, 'Text:', `Tel: ${primaryContact.phone}`);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tel: ${primaryContact.phone}`, billingCol, yPos + 28);
  }
  if (primaryContact.email) {
    console.log('PDF contactInfo - Adding email at Y position:', yPos + 32, 'Text:', `Email: ${primaryContact.email}`);
    doc.setTextColor(0, 0, 0);
    doc.text(`Email: ${primaryContact.email}`, billingCol, yPos + 32);
  }
  
  // Right column contact info
  if (primaryContact.phone) {
    console.log('PDF contactInfo - Adding right column phone at Y position:', yPos + 28);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tel: ${primaryContact.phone}`, serviceCol, yPos + 28);
  }
  if (primaryContact.email) {
    console.log('PDF contactInfo - Adding right column email at Y position:', yPos + 32);
    doc.setTextColor(0, 0, 0);
    doc.text(`Email: ${primaryContact.email}`, serviceCol, yPos + 32);
  }
};
