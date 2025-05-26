
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const addCompanyInfo = (doc: jsPDF, context: PDFGenerationContext): void => {
  const { businessSettings } = context;
  
  // Parse business address
  const addressParts = businessSettings.businessAddress.split(',').map(part => part.trim());
  const streetAddress = addressParts[0] || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts.slice(2).join(', ') || '';
  
  // Company Information (first column) - narrower margin
  const companyInfoX = 10;
  const companyInfoY = 35;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  let currentY = companyInfoY;
  
  if (businessSettings.showCompanyNameOnPDF) {
    doc.setFont('helvetica', 'bold');
    doc.text(businessSettings.companyName, companyInfoX, currentY);
    currentY += 4;
  }
  
  doc.setFont('helvetica', 'normal');
  doc.text(streetAddress, companyInfoX, currentY);
  currentY += 4;
  
  if (city) {
    doc.text(city + (stateZip ? ', ' + stateZip : ''), companyInfoX, currentY);
    currentY += 4;
  }
  
  doc.text('United States', companyInfoX, currentY);
  currentY += 6;
  
  doc.text(`Tel: ${businessSettings.businessPhone}`, companyInfoX, currentY);
  currentY += 4;
  
  if (businessSettings.businessFax && businessSettings.businessFax.trim() !== '') {
    doc.text(`Fax: ${businessSettings.businessFax}`, companyInfoX, currentY);
  }
};
