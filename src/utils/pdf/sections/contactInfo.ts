
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';

export const renderContactInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number, rightColYPos: number): void => {
  const { clientInfo } = context;
  
  if (!clientInfo) return;
  
  // Left column contact info
  if (clientInfo.phone) {
    console.log('PDF contactInfo - Adding phone at Y position:', yPos + 28, 'Text:', `Tel: ${clientInfo.phone}`);
    doc.setTextColor(0, 0, 0); // Ensure black text
    doc.text(`Tel: ${clientInfo.phone}`, 20, yPos + 28);
  }
  if (clientInfo.email) {
    console.log('PDF contactInfo - Adding email at Y position:', yPos + 35, 'Text:', `Email: ${clientInfo.email}`);
    doc.setTextColor(0, 0, 0); // Ensure black text
    doc.text(`Email: ${clientInfo.email}`, 20, yPos + 35);
  }
  
  // Right column contact info
  if (clientInfo.phone) {
    console.log('PDF contactInfo - Adding right column phone at Y position:', rightColYPos + 28);
    doc.setTextColor(0, 0, 0); // Ensure black text
    doc.text(`Tel: ${clientInfo.phone}`, 110, rightColYPos + 28);
  }
  if (clientInfo.email) {
    console.log('PDF contactInfo - Adding right column email at Y position:', rightColYPos + 35);
    doc.setTextColor(0, 0, 0); // Ensure black text
    doc.text(`Email: ${clientInfo.email}`, 110, rightColYPos + 35);
  }
};
