
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';
import { resolveBillingAddress, resolveServiceAddress } from './helpers/addressResolver';

export const addClientInfo = (doc: jsPDF, context: PDFGenerationContext): number => {
  const { quote, clientInfo } = context;
  
  console.log('PDF clientInfo.ts - Starting addClientInfo with:', {
    quoteId: quote.id,
    quoteBillingAddress: quote.billingAddress,
    quoteServiceAddress: quote.serviceAddress,
    clientInfoAddress: clientInfo?.address,
    hasClientInfo: !!clientInfo
  });
  
  if (!clientInfo) {
    console.log('PDF clientInfo.ts - No clientInfo provided, returning early');
    return 100;
  }
  
  // Section headers - positioned like reference
  let yPos = 100;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 115, yPos);
  
  yPos += 8;
  
  // Resolve addresses
  const billingAddress = resolveBillingAddress(context);
  const serviceAddress = resolveServiceAddress(context, billingAddress);
  
  // Set font for content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Left column - Billing Information
  let leftY = yPos;
  
  // Company name
  doc.setFont('helvetica', 'bold');
  doc.text(clientInfo.company_name, 20, leftY);
  doc.setFont('helvetica', 'normal');
  leftY += 4;
  
  // Contact name
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, 20, leftY);
    leftY += 4;
  }
  
  // Billing address
  if (billingAddress && billingAddress.trim() !== '') {
    const addressLines = formatAddressForPDF(billingAddress);
    addressLines.forEach(line => {
      doc.text(line, 20, leftY);
      leftY += 4;
    });
  }
  
  leftY += 2;
  
  // Contact info
  if (clientInfo.phone) {
    doc.text(`Tel: ${clientInfo.phone}`, 20, leftY);
    leftY += 4;
  }
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, 20, leftY);
  }
  
  // Right column - Service Address
  let rightY = yPos;
  
  // Company name
  doc.setFont('helvetica', 'bold');
  doc.text(clientInfo.company_name, 115, rightY);
  doc.setFont('helvetica', 'normal');
  rightY += 4;
  
  // Contact name
  if (clientInfo.contact_name) {
    doc.text(clientInfo.contact_name, 115, rightY);
    rightY += 4;
  }
  
  // Service address
  if (serviceAddress && serviceAddress.trim() !== '') {
    const addressLines = formatAddressForPDF(serviceAddress);
    addressLines.forEach(line => {
      doc.text(line, 115, rightY);
      rightY += 4;
    });
  }
  
  rightY += 2;
  
  // Contact info
  if (clientInfo.phone) {
    doc.text(`Tel: ${clientInfo.phone}`, 115, rightY);
    rightY += 4;
  }
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, 115, rightY);
  }
  
  return Math.max(leftY, rightY) + 10;
};

const formatAddressForPDF = (addressString: string): string[] => {
  if (!addressString) return [];
  
  const parts = addressString.split(',').map(part => part.trim());
  const lines: string[] = [];
  
  if (parts.length >= 3) {
    // Check if second part is a suite/unit
    const suitePattern = /^(suite|unit|apt|apartment|ste|floor|fl|#)\s/i;
    
    if (suitePattern.test(parts[1])) {
      lines.push(`${parts[0]}`);
      lines.push(`${parts[1]}`);
      lines.push(`${parts[2]}, ${parts.slice(3).join(', ')}`);
    } else {
      lines.push(parts[0]);
      lines.push(`${parts[1]}, ${parts.slice(2).join(', ')}`);
    }
  } else if (parts.length === 2) {
    lines.push(parts[0]);
    lines.push(parts[1]);
  } else {
    lines.push(addressString);
  }
  
  lines.push('United States');
  
  return lines;
};
