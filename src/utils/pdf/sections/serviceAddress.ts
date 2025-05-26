
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';
import { formatAddress } from '../addressFormatting';

export const renderServiceAddress = (doc: jsPDF, context: PDFGenerationContext, rightColYPos: number, serviceAddress: string | null): number => {
  const { clientInfo } = context;
  
  if (!clientInfo) return 0;
  
  let currentY = rightColYPos;
  
  // Company name in bold
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(clientInfo.company_name, 110, currentY);
  currentY += 5;
  
  // Contact name
  if (clientInfo.contact_name) {
    doc.setFont('helvetica', 'normal');
    doc.text(clientInfo.contact_name, 110, currentY);
    currentY += 5;
  }
  
  if (serviceAddress && serviceAddress.trim() !== '') {
    console.log('PDF serviceAddress - Processing service address:', serviceAddress);
    const formattedService = formatAddress(serviceAddress);
    console.log('PDF serviceAddress - Formatted service address result:', formattedService);
    
    if (formattedService) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(formattedService.street, 110, currentY);
      currentY += 5;
      
      if (formattedService.cityStateZip) {
        doc.text(formattedService.cityStateZip, 110, currentY);
        currentY += 5;
      }
      
      // Add "United States" line
      doc.text('United States', 110, currentY);
      currentY += 8;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No service address specified', 110, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    currentY += 8;
  }
  
  // Contact information
  if (clientInfo.phone) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Tel: ${clientInfo.phone}`, 110, currentY);
    currentY += 5;
  }
  
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, 110, currentY);
  }
  
  return 0;
};
