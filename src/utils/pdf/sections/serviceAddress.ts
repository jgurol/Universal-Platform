
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';
import { formatAddress } from '../addressFormatting';

export const renderServiceAddress = (doc: jsPDF, context: PDFGenerationContext, yPos: number, serviceAddress: string | null, xPos: number = 67): number => {
  const { clientInfo } = context;
  
  if (!clientInfo) return 0;
  
  // Service address (second column)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(clientInfo.company_name, xPos, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  let rightYOffset = 0;
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, xPos, yPos + 4);
    rightYOffset = 4;
  }
  
  if (serviceAddress && serviceAddress.trim() !== '') {
    console.log('PDF serviceAddress - Processing service address:', serviceAddress);
    const formattedService = formatAddress(serviceAddress);
    console.log('PDF serviceAddress - Formatted service address result:', formattedService);
    
    if (formattedService) {
      const serviceStreetY = yPos + 4 + rightYOffset;
      const serviceCityY = yPos + 8 + rightYOffset;
      
      try {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(formattedService.street, xPos, serviceStreetY);
        console.log('PDF serviceAddress - Successfully added service street');
        
        if (formattedService.cityStateZip) {
          doc.setTextColor(0, 0, 0);
          doc.text(formattedService.cityStateZip, xPos, serviceCityY);
          doc.text('United States', xPos, serviceCityY + 4);
          console.log('PDF serviceAddress - Successfully added service cityStateZip');
        }
      } catch (error) {
        console.error('PDF serviceAddress - Error adding service address:', error);
      }
    }
  } else {
    console.log('PDF serviceAddress - No service address found, showing fallback message');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No service address specified', xPos, yPos + 4 + rightYOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }
  
  return rightYOffset;
};
