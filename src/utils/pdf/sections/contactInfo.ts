
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';

export const renderContactInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, billingCol: number = 20, serviceCol: number = 67): void => {
  const { clientInfo } = context;
  
  if (!clientInfo) return;
  
  // Left column contact info
  if (clientInfo.phone) {
    console.log('PDF contactInfo - Adding phone at Y position:', yPos + 28, 'Text:', `Tel: ${clientInfo.phone}`);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tel: ${clientInfo.phone}`, billingCol, yPos + 28);
  }
  if (clientInfo.email) {
    console.log('PDF contactInfo - Adding email at Y position:', yPos + 32, 'Text:', `Email: ${clientInfo.email}`);
    doc.setTextColor(0, 0, 0);
    doc.text(`Email: ${clientInfo.email}`, billingCol, yPos + 32);
  }
  
  // Right column contact info
  if (clientInfo.phone) {
    console.log('PDF contactInfo - Adding right column phone at Y position:', yPos + 28);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tel: ${clientInfo.phone}`, serviceCol, yPos + 28);
  }
  if (clientInfo.email) {
    console.log('PDF contactInfo - Adding right column email at Y position:', yPos + 32);
    doc.setTextColor(0, 0, 0);
    doc.text(`Email: ${clientInfo.email}`, serviceCol, yPos + 32);
  }
};
