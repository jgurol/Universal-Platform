import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/pages/Index';

export const generateQuotePDF = (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  const doc = new jsPDF();
  
  // Company Header with branding
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 96); // Dark blue color
  doc.text('CALIFORNIA | TELECOM', 20, 25);
  
  // Document type in top right
  doc.setFontSize(14);
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Agreement', 160, 25);
  
  // Company Information (left side)
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont('helvetica', 'bold');
  doc.text('California Telecom, Inc.', 20, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('14538 Central Ave', 20, 47);
  doc.text('Chino, CA 91710', 20, 54);
  doc.text('United States', 20, 61);
  doc.text('Tel: 213-270-1349', 20, 72);
  doc.text('Fax: 213-232-3304', 20, 79);
  
  // Agreement details box (right side)
  const boxX = 130;
  const boxY = 40;
  const boxWidth = 65;
  const boxHeight = 45;
  
  // Draw box with gray background
  doc.setFillColor(240, 240, 240);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  // Agreement details inside box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Agreement', boxX + 3, boxY + 8);
  doc.text('Date:', boxX + 3, boxY + 18);
  doc.text('Expires', boxX + 3, boxY + 28);
  doc.text('Account', boxX + 3, boxY + 38);
  doc.text('Manager', boxX + 3, boxY + 44);
  
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`, boxX + 35, boxY + 8);
  doc.text(new Date(quote.date).toLocaleDateString(), boxX + 20, boxY + 18);
  doc.text(quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString() : 'N/A', boxX + 20, boxY + 28);
  doc.text(salespersonName || 'N/A', boxX + 20, boxY + 44);
  
  // Billing Information and Service Address sections (side by side)
  let yPos = 95;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 110, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (clientInfo) {
    // Billing info (left column)
    doc.text(clientInfo.company_name, 20, yPos);
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 20, yPos + 7);
    }
    if (clientInfo.address) {
      const addressLines = doc.splitTextToSize(clientInfo.address, 80);
      doc.text(addressLines.slice(0, 3), 20, yPos + 14); // Limit to 3 lines
    }
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 20, yPos + 35);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 20, yPos + 42);
    }
    
    // Service address (right column) - same as billing for now
    doc.text(clientInfo.company_name, 110, yPos);
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 110, yPos + 7);
    }
    if (clientInfo.address) {
      const addressLines = doc.splitTextToSize(clientInfo.address, 80);
      doc.text(addressLines.slice(0, 3), 110, yPos + 14);
    }
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 110, yPos + 35);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 110, yPos + 42);
    }
  }
  
  // Accept Agreement button (green box)
  const buttonX = 110;
  const buttonY = yPos + 50;
  const buttonWidth = 80;
  const buttonHeight = 12;
  
  doc.setFillColor(76, 175, 80); // Green color
  doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ACCEPT AGREEMENT', buttonX + 12, buttonY + 8);
  
  // Quote Title
  yPos = 155;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const quoteTitle = quote.description || clientInfo?.company_name + ' - Service Agreement';
  doc.text(quoteTitle, 20, yPos);
  
  // Items Section - Monthly Fees
  yPos += 15;
  
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    const mrcItems = quote.quoteItems.filter(item => item.charge_type === 'MRC');
    const nrcItems = quote.quoteItems.filter(item => item.charge_type === 'NRC');
    
    // Monthly Fees Section
    if (mrcItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Fees', 20, yPos);
      yPos += 10;
      
      // Table headers with background
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPos - 5, 170, 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 22, yPos);
      doc.text('Qty', 130, yPos);
      doc.text('Price', 150, yPos);
      doc.text('Total', 175, yPos);
      
      yPos += 8;
      
      // MRC Items with detailed descriptions
      doc.setFont('helvetica', 'normal');
      mrcItems.forEach((item, index) => {
        const itemName = item.item?.name || 'Monthly Service';
        
        // Main item row
        doc.text(itemName, 22, yPos);
        doc.text(item.quantity.toString(), 130, yPos);
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, 150, yPos);
        doc.text(`$${Number(item.total_price).toFixed(2)}`, 175, yPos);
        yPos += 6;
        
        // Add service details if available
        if (item.item?.description) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const descLines = doc.splitTextToSize(item.item.description, 100);
          doc.text(descLines.slice(0, 2), 25, yPos); // Limit to 2 lines
          yPos += descLines.slice(0, 2).length * 4;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
        }
        
        yPos += 2; // Small spacing between items
      });
      
      // Total line
      yPos += 5;
      doc.setDrawColor(0, 0, 0);
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      
      const mrcTotal = mrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Monthly', 130, yPos);
      doc.text(`$${mrcTotal.toFixed(2)} USD`, 150, yPos);
    }
    
    // One-Time Fees (if any, but keep compact)
    if (nrcItems.length > 0 && yPos < 250) {
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('One-Time Fees:', 20, yPos);
      
      const nrcTotal = nrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      doc.text(`$${nrcTotal.toFixed(2)} USD`, 150, yPos);
    }
  }
  
  // Notes section (if space allows)
  if (quote.notes && yPos < 260) {
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 20, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, 170);
    doc.text(splitNotes.slice(0, 2), 20, yPos); // Limit notes to 2 lines
  }
  
  return doc;
};
