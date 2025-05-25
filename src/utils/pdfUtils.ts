
import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/pages/Index';

export const generateQuotePDF = (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  const doc = new jsPDF();
  
  // Company Header with branding
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 96); // Dark blue color
  doc.text('CALIFORNIA | TELECOM', 20, 30);
  
  // Document type in top right
  doc.setFontSize(16);
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Quote', 160, 30);
  
  // Company Information
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont('helvetica', 'normal');
  doc.text('California Telecom, Inc.', 20, 50);
  doc.text('14538 Central Ave', 20, 58);
  doc.text('Chino, CA 91710', 20, 66);
  doc.text('United States', 20, 74);
  doc.text('Tel: 213-270-1349', 20, 86);
  doc.text('Fax: 213-232-3304', 20, 94);
  
  // Quote details box in top right
  const boxX = 130;
  const boxY = 50;
  const boxWidth = 60;
  const boxHeight = 50;
  
  // Draw box border
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  // Quote details inside box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote', boxX + 5, boxY + 10);
  doc.text('Date:', boxX + 5, boxY + 25);
  doc.text('Account Manager:', boxX + 5, boxY + 40);
  
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`, boxX + 25, boxY + 10);
  doc.text(new Date(quote.date).toLocaleDateString(), boxX + 20, boxY + 25);
  doc.text(salespersonName || 'N/A', boxX + 5, boxY + 48);
  
  // Customer Information Section
  let yPos = 120;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Address', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (clientInfo) {
    doc.text(clientInfo.company_name, 20, yPos);
    yPos += 8;
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 20, yPos);
      yPos += 8;
    }
    if (clientInfo.address) {
      const addressLines = doc.splitTextToSize(clientInfo.address, 80);
      doc.text(addressLines, 20, yPos);
      yPos += addressLines.length * 8;
    }
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 20, yPos + 8);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 20, yPos + 16);
    }
  }
  
  // Quote Title
  yPos = 180;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const quoteTitle = quote.description || 'Professional Services Quote';
  doc.text(quoteTitle, 20, yPos);
  
  // Items Section
  yPos += 20;
  
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    // Separate NRC and MRC items
    const nrcItems = quote.quoteItems.filter(item => item.charge_type === 'NRC');
    const mrcItems = quote.quoteItems.filter(item => item.charge_type === 'MRC');
    
    // One-Time Fees Section
    if (nrcItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('One-Time Fees', 20, yPos);
      yPos += 15;
      
      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, yPos);
      doc.text('Qty', 120, yPos);
      doc.text('Price', 140, yPos);
      doc.text('Total', 170, yPos);
      
      // Header line
      doc.setDrawColor(0, 0, 0);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      
      // NRC Items
      doc.setFont('helvetica', 'normal');
      nrcItems.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        const itemName = item.item?.name || 'Professional Service';
        doc.text(itemName, 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, 140, yPos);
        doc.text(`$${Number(item.total_price).toFixed(2)}`, 170, yPos);
        yPos += 8;
      });
      
      // Scope of work section (if description exists)
      if (quote.description && quote.description !== quoteTitle) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Scope of work', 20, yPos);
        yPos += 10;
        
        doc.setFont('helvetica', 'normal');
        const scopeLines = doc.splitTextToSize(quote.description, 170);
        doc.text(scopeLines, 20, yPos);
        yPos += scopeLines.length * 8;
      }
      
      // NRC Total
      const nrcTotal = nrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      yPos += 15;
      doc.setDrawColor(0, 0, 0);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Total One-Time`, 120, yPos);
      doc.text(`$${nrcTotal.toFixed(2)} USD`, 150, yPos);
      yPos += 20;
    }
    
    // Monthly Recurring Fees Section
    if (mrcItems.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Recurring Fees', 20, yPos);
      yPos += 15;
      
      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, yPos);
      doc.text('Qty', 120, yPos);
      doc.text('Price', 140, yPos);
      doc.text('Total', 170, yPos);
      
      // Header line
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      
      // MRC Items
      doc.setFont('helvetica', 'normal');
      mrcItems.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        const itemName = item.item?.name || 'Monthly Service';
        doc.text(itemName, 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, 140, yPos);
        doc.text(`$${Number(item.total_price).toFixed(2)}`, 170, yPos);
        yPos += 8;
      });
      
      // MRC Total
      const mrcTotal = mrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      yPos += 15;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Monthly`, 120, yPos);
      doc.text(`$${mrcTotal.toFixed(2)} USD`, 150, yPos);
    }
  }
  
  // Notes section
  if (quote.notes) {
    yPos += 30;
    if (yPos > 230) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }
  
  // Quote status and expiration
  if (quote.status || quote.expiresAt) {
    yPos += 40;
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (quote.status) {
      doc.text(`Status: ${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}`, 20, yPos);
    }
    if (quote.expiresAt) {
      doc.text(`Quote Expires: ${new Date(quote.expiresAt).toLocaleDateString()}`, 20, yPos + 10);
    }
  }
  
  return doc;
};
