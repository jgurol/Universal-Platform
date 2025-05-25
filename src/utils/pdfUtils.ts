
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
  
  // Company Information (left side) - Better aligned
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont('helvetica', 'bold');
  doc.text('California Telecom, Inc.', 20, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('14538 Central Ave', 20, 47);
  doc.text('Chino, CA 91710', 20, 54);
  doc.text('United States', 20, 61);
  doc.text('Tel: 213-270-1349', 20, 68);
  doc.text('Fax: 213-232-3304', 20, 75);
  
  // Agreement details box (right side) - Fixed positioning
  const boxX = 125;
  const boxY = 40;
  const boxWidth = 70;
  const boxHeight = 40;
  
  // Draw box with gray background
  doc.setFillColor(245, 245, 245);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  // Agreement details inside box - Better aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Agreement #:', boxX + 4, boxY + 8);
  doc.text('Date:', boxX + 4, boxY + 16);
  doc.text('Expires:', boxX + 4, boxY + 24);
  doc.text('Account Manager:', boxX + 4, boxY + 32);
  
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`, boxX + 30, boxY + 8);
  doc.text(new Date(quote.date).toLocaleDateString(), boxX + 18, boxY + 16);
  doc.text(quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString() : 'N/A', boxX + 22, boxY + 24);
  doc.text(salespersonName || 'N/A', boxX + 4, boxY + 38);
  
  // Billing Information and Service Address sections (side by side) - Better positioning
  let yPos = 90;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 110, yPos);
  
  // Draw separator lines under headers
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos + 2, 85, yPos + 2);
  doc.line(110, yPos + 2, 175, yPos + 2);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (clientInfo) {
    // Billing info (left column) - Use custom billing address if available
    doc.text(clientInfo.company_name, 20, yPos);
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 20, yPos + 7);
    }
    
    // Use custom billing address from quote if provided, otherwise fall back to client info address
    const billingAddress = quote.billingAddress || clientInfo.address;
    console.log('PDF Generation - Quote billing address:', quote.billingAddress);
    console.log('PDF Generation - Client info address:', clientInfo.address);
    console.log('PDF Generation - Final billing address used:', billingAddress);
    
    if (billingAddress) {
      const addressLines = doc.splitTextToSize(billingAddress, 75);
      doc.text(addressLines.slice(0, 2), 20, yPos + 14);
    }
    
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 20, yPos + 28);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 20, yPos + 35);
    }
    
    // Service address (right column) - Use custom service address if available
    doc.text(clientInfo.company_name, 110, yPos);
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 110, yPos + 7);
    }
    
    // Use custom service address from quote if provided, otherwise fall back to billing address
    const serviceAddress = quote.serviceAddress || quote.billingAddress || clientInfo.address;
    console.log('PDF Generation - Quote service address:', quote.serviceAddress);
    console.log('PDF Generation - Final service address used:', serviceAddress);
    
    if (serviceAddress) {
      const addressLines = doc.splitTextToSize(serviceAddress, 75);
      doc.text(addressLines.slice(0, 2), 110, yPos + 14);
    }
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 110, yPos + 28);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 110, yPos + 35);
    }
  }
  
  // Accept Agreement button (green box) - Better positioned
  const buttonX = 125;
  const buttonY = yPos + 45;
  const buttonWidth = 70;
  const buttonHeight = 12;
  
  doc.setFillColor(76, 175, 80); // Green color
  doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ACCEPT AGREEMENT', buttonX + 10, buttonY + 8);
  
  // Quote Title - Properly spaced
  yPos = 155;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const quoteTitle = quote.description || (clientInfo?.company_name ? `${clientInfo.company_name} - Service Agreement` : 'Service Agreement');
  doc.text(quoteTitle, 20, yPos);
  
  // Items Section - Monthly Fees with proper table structure
  yPos += 15;
  
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    const mrcItems = quote.quoteItems.filter(item => item.charge_type === 'MRC');
    const nrcItems = quote.quoteItems.filter(item => item.charge_type === 'NRC');
    
    // Monthly Fees Section
    if (mrcItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Fees', 20, yPos);
      yPos += 12;
      
      // Table structure with proper column alignment
      const colX = {
        description: 20,
        qty: 130,
        price: 155,
        total: 175
      };
      
      // Table headers with background
      doc.setFillColor(240, 240, 240);
      doc.rect(colX.description, yPos - 8, 175, 10, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(colX.description, yPos - 8, 175, 10);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', colX.description + 2, yPos - 2);
      doc.text('Qty', colX.qty + 2, yPos - 2);
      doc.text('Price', colX.price + 2, yPos - 2);
      doc.text('Total', colX.total + 2, yPos - 2);
      
      yPos += 5;
      
      // MRC Items with aligned columns
      doc.setFont('helvetica', 'normal');
      mrcItems.forEach((item, index) => {
        const itemName = item.item?.name || 'Monthly Service';
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(colX.description, yPos - 4, 175, 8, 'F');
        }
        
        // Main item row with proper column alignment
        doc.setTextColor(0, 0, 0);
        doc.text(itemName.substring(0, 35), colX.description + 2, yPos);
        doc.text(item.quantity.toString(), colX.qty + 2, yPos);
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, colX.price + 2, yPos);
        doc.text(`$${Number(item.total_price).toFixed(2)}`, colX.total + 2, yPos);
        yPos += 8;
      });
      
      // Total line with proper alignment
      yPos += 2;
      doc.setDrawColor(0, 0, 0);
      doc.line(colX.description, yPos, 195, yPos);
      yPos += 8;
      
      const mrcTotal = mrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Monthly:', colX.price - 20, yPos);
      doc.text(`$${mrcTotal.toFixed(2)} USD`, colX.total + 2, yPos);
    }
    
    // One-Time Fees (compact format if space allows)
    if (nrcItems.length > 0 && yPos < 250) {
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('One-Time Setup Fees:', 20, yPos);
      
      const nrcTotal = nrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      doc.text(`$${nrcTotal.toFixed(2)} USD`, 175, yPos);
    }
  }
  
  // Notes section (if space allows) - Properly positioned
  if (quote.notes && yPos < 260) {
    yPos += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 20, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, 175);
    doc.text(splitNotes.slice(0, 2), 20, yPos);
  }
  
  return doc;
};
