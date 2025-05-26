
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const addCompanyInfo = (doc: jsPDF, context: PDFGenerationContext): void => {
  const { businessSettings } = context;
  
  // Parse business address
  const addressParts = businessSettings.businessAddress.split(',').map(part => part.trim());
  const streetAddress = addressParts[0] || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts.slice(2).join(', ') || '';
  
  // Company Information (left side) - positioned below the header
  const companyInfoY = 45;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  let currentY = companyInfoY;
  
  if (businessSettings.showCompanyNameOnPDF) {
    doc.setFont('helvetica', 'bold');
    doc.text(businessSettings.companyName, 20, currentY);
    currentY += 5;
  }
  
  doc.setFont('helvetica', 'normal');
  doc.text(streetAddress, 20, currentY);
  currentY += 5;
  
  if (city && stateZip) {
    doc.text(`${city}, ${stateZip}`, 20, currentY);
    currentY += 5;
  }
  
  // Add "United States" line
  doc.text('United States', 20, currentY);
  currentY += 8;
  
  doc.text(`Tel: ${businessSettings.businessPhone}`, 20, currentY);
  currentY += 5;
  
  if (businessSettings.businessFax && businessSettings.businessFax.trim() !== '') {
    doc.text(`Fax: ${businessSettings.businessFax}`, 20, currentY);
  }
};
