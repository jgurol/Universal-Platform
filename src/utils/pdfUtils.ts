
import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/pages/Index';

export const generateQuotePDF = (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('QUOTE', 20, 30);
  
  // Quote details
  doc.setFontSize(12);
  doc.text(`Quote Number: ${quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}`, 20, 50);
  doc.text(`Date: ${new Date(quote.date).toLocaleDateString()}`, 20, 60);
  doc.text(`Status: ${(quote.status || 'pending').charAt(0).toUpperCase() + (quote.status || 'pending').slice(1)}`, 20, 70);
  
  if (quote.expiresAt) {
    doc.text(`Expires: ${new Date(quote.expiresAt).toLocaleDateString()}`, 20, 80);
  }
  
  // Customer information
  doc.setFontSize(14);
  doc.text('Customer Information:', 20, 100);
  doc.setFontSize(12);
  
  if (clientInfo) {
    doc.text(`Company: ${clientInfo.company_name}`, 20, 115);
    if (clientInfo.contact_name) {
      doc.text(`Contact: ${clientInfo.contact_name}`, 20, 125);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 20, 135);
    }
    if (clientInfo.phone) {
      doc.text(`Phone: ${clientInfo.phone}`, 20, 145);
    }
  }
  
  // Salesperson
  if (salespersonName) {
    doc.text(`Salesperson: ${salespersonName}`, 20, 160);
  }
  
  // Quote description
  if (quote.description) {
    doc.setFontSize(14);
    doc.text('Description:', 20, 180);
    doc.setFontSize(12);
    
    // Split long descriptions into multiple lines
    const splitDescription = doc.splitTextToSize(quote.description, 170);
    doc.text(splitDescription, 20, 195);
  }
  
  // Quote items if available
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    let yPosition = quote.description ? 220 : 200;
    
    doc.setFontSize(14);
    doc.text('Items:', 20, yPosition);
    yPosition += 15;
    
    // Table headers
    doc.setFontSize(10);
    doc.text('Description', 20, yPosition);
    doc.text('Qty', 100, yPosition);
    doc.text('Unit Price', 125, yPosition);
    doc.text('Type', 155, yPosition);
    doc.text('Total', 175, yPosition);
    yPosition += 10;
    
    // Draw line under headers
    doc.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Quote items
    quote.quoteItems.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      
      const itemName = item.item?.name || 'Unknown Item';
      doc.text(itemName, 20, yPosition);
      doc.text(item.quantity.toString(), 100, yPosition);
      doc.text(`$${Number(item.unit_price).toLocaleString()}`, 125, yPosition);
      doc.text(item.charge_type || 'NRC', 155, yPosition);
      doc.text(`$${Number(item.total_price).toLocaleString()}`, 175, yPosition);
      yPosition += 10;
    });
    
    // Totals
    yPosition += 10;
    doc.line(20, yPosition, 200, yPosition);
    yPosition += 10;
    
    const mrcTotal = quote.quoteItems
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + (Number(item.total_price) || 0), 0);
    
    const nrcTotal = quote.quoteItems
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + (Number(item.total_price) || 0), 0);
    
    doc.setFontSize(12);
    if (nrcTotal > 0) {
      doc.text(`Total NRC: $${nrcTotal.toLocaleString()}`, 140, yPosition);
      yPosition += 15;
    }
    if (mrcTotal > 0) {
      doc.text(`Total MRC: $${mrcTotal.toLocaleString()}`, 140, yPosition);
      yPosition += 15;
    }
  }
  
  // Notes
  if (quote.notes) {
    let yPosition = quote.quoteItems && quote.quoteItems.length > 0 ? yPosition + 20 : 240;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(14);
    doc.text('Notes:', 20, yPosition);
    doc.setFontSize(12);
    yPosition += 15;
    
    const splitNotes = doc.splitTextToSize(quote.notes, 170);
    doc.text(splitNotes, 20, yPosition);
  }
  
  return doc;
};
