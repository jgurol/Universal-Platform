
import jsPDF from 'jspdf';
import { PDFGenerationContext } from '../types';
import { formatAddress } from '../addressFormatting';

export const renderServiceAddress = (doc: jsPDF, context: PDFGenerationContext, rightColYPos: number, serviceAddress: string | null): number => {
  const { clientInfo } = context;
  
  if (!clientInfo) return 0;
  
  // Service address (right column)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Ensure black text
  doc.text(clientInfo.company_name, 110, rightColYPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // Reset to black for normal text
  
  let rightYOffset = 0;
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, 110, rightColYPos + 7);
    rightYOffset = 7;
  }
  
  if (serviceAddress && serviceAddress.trim() !== '') {
    console.log('PDF serviceAddress - Processing service address:', serviceAddress);
    const formattedService = formatAddress(serviceAddress);
    console.log('PDF serviceAddress - Formatted service address result:', formattedService);
    
    if (formattedService) {
      const serviceStreetY = rightColYPos + 7 + rightYOffset;
      const serviceCityY = rightColYPos + 14 + rightYOffset;
      
      console.log('PDF serviceAddress - About to add service street at Y position:', serviceStreetY);
      console.log('PDF serviceAddress - Service street text:', formattedService.street);
      
      try {
        doc.setTextColor(0, 0, 0); // Explicitly set black text
        doc.setFont('helvetica', 'normal');
        doc.text(formattedService.street, 110, serviceStreetY);
        console.log('PDF serviceAddress - Successfully added service street');
      } catch (error) {
        console.error('PDF serviceAddress - Error adding service street:', error);
      }
      
      if (formattedService.cityStateZip) {
        console.log('PDF serviceAddress - About to add service cityStateZip at Y position:', serviceCityY);
        console.log('PDF serviceAddress - Service cityStateZip text:', formattedService.cityStateZip);
        try {
          doc.setTextColor(0, 0, 0); // Explicitly set black text
          doc.text(formattedService.cityStateZip, 110, serviceCityY);
          console.log('PDF serviceAddress - Successfully added service cityStateZip');
        } catch (error) {
          console.error('PDF serviceAddress - Error adding service cityStateZip:', error);
        }
      } else {
        console.log('PDF serviceAddress - No cityStateZip for service address');
      }
    } else {
      console.log('PDF serviceAddress - formatAddress returned null for service');
    }
  } else {
    console.log('PDF serviceAddress - No service address found, showing fallback message');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No service address specified', 110, rightColYPos + 7 + rightYOffset);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }
  
  return rightYOffset;
};
