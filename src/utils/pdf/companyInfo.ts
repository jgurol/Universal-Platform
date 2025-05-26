
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const addCompanyInfo = (doc: jsPDF, context: PDFGenerationContext): void => {
  const { businessSettings } = context;
  
  // Parse business address
  const addressParts = businessSettings.businessAddress.split(',').map(part => part.trim());
  const streetAddress = addressParts[0] || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts.slice(2).join(', ') || '';
  
  // Company Information positioned to match reference
  const companyInfoY = 50;
  
  let currentY = companyInfoY;
  
  // Company name - larger and bold like in reference
  if (businessSettings.showCompanyNameOnPDF) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(businessSettings.companyName, 20, currentY);
    currentY += 5;
  }
  
  // Address information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  doc.text(streetAddress, 20, currentY);
  currentY += 4;
  
  if (city && stateZip) {
    doc.text(`${city}, ${stateZip}`, 20, currentY);
    currentY += 4;
  }
  
  doc.text('United States', 20, currentY);
  currentY += 6;
  
  // Contact information
  doc.text(`Tel: ${businessSettings.businessPhone}`, 20, currentY);
  currentY += 4;
  
  if (businessSettings.businessFax && businessSettings.businessFax.trim() !== '') {
    doc.text(`Fax: ${businessSettings.businessFax}`, 20, currentY);
  }
};
