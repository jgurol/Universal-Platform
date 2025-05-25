import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';
import { addMarkdownTextToPDF } from './markdownToPdf';

export const generateQuotePDF = async (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  const doc = new jsPDF();
  
  // Debug logging - let's see exactly what we're getting
  console.log('PDF Generation - Full quote object received:', quote);
  console.log('PDF Generation - Quote serviceAddress:', quote.serviceAddress);
  console.log('PDF Generation - Quote billingAddress:', quote.billingAddress);
  console.log('PDF Generation - ClientInfo object:', clientInfo);
  
  // Load and add company logo if available
  const logoUrl = localStorage.getItem('company_logo_url');
  let logoYOffset = 0;
  
  if (logoUrl) {
    try {
      // Create an image element to load the logo
      const img = new Image();
      img.onload = function() {
        // Calculate dimensions to fit logo in top-left corner
        const maxWidth = 60;
        const maxHeight = 30;
        const aspectRatio = img.width / img.height;
        
        let logoWidth = maxWidth;
        let logoHeight = maxWidth / aspectRatio;
        
        if (logoHeight > maxHeight) {
          logoHeight = maxHeight;
          logoWidth = maxHeight * aspectRatio;
        }
        
        // Add logo to top-left corner
        doc.addImage(logoUrl, 'JPEG', 20, 15, logoWidth, logoHeight);
        logoYOffset = logoHeight + 5;
      };
      img.src = logoUrl;
      
      // Wait a moment for the image to load
      await new Promise(resolve => setTimeout(resolve, 100));
      logoYOffset = 35; // Assume standard logo height for layout
    } catch (error) {
      console.error('Error loading logo:', error);
      logoYOffset = 0;
    }
  }
  
  // Adjust header positioning based on logo
  const headerYStart = Math.max(25, 15 + logoYOffset);
  
  // Document type in top right
  doc.setFontSize(14);
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Agreement', 160, headerYStart);
  
  // Company Information (left side) - Better aligned
  const companyInfoY = headerYStart + 15;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont('helvetica', 'bold');
  doc.text('California Telecom, Inc.', 20, companyInfoY);
  doc.setFont('helvetica', 'normal');
  doc.text('14538 Central Ave', 20, companyInfoY + 7);
  doc.text('Chino, CA 91710', 20, companyInfoY + 14);
  doc.text('United States', 20, companyInfoY + 21);
  doc.text('Tel: 213-270-1349', 20, companyInfoY + 28);
  doc.text('Fax: 213-232-3304', 20, companyInfoY + 35);
  
  // Agreement details box (right side) - Fixed positioning
  const boxX = 125;
  const boxY = companyInfoY;
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
  let yPos = companyInfoY + 50;
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
  
  // Helper function to format address into proper structure
  const formatAddress = (addressString: string) => {
    if (!addressString) return null;
    
    console.log('Formatting address:', addressString);
    
    // Split by comma and clean up
    const parts = addressString.split(',').map(part => part.trim());
    console.log('Address parts:', parts);
    
    // Look for common patterns to identify where the street address ends
    if (parts.length >= 3) {
      // Check if second part looks like a suite/unit (starts with Suite, Unit, Apt, etc.)
      const secondPart = parts[1];
      const suitePattern = /^(suite|unit|apt|apartment|ste|floor|fl|#)\s/i;
      
      if (suitePattern.test(secondPart)) {
        // Second part is a suite/unit, combine with first part for street address
        const streetAddress = `${parts[0]}, ${parts[1]}`;
        const city = parts[2];
        const stateZip = parts.slice(3).join(', ');
        
        console.log('Parsed address with suite:', { streetAddress, city, stateZip });
        
        return {
          street: streetAddress,
          cityStateZip: `${city}${stateZip ? ', ' + stateZip : ''}`
        };
      } else {
        // Standard format: "Street, City, State Zip"
        const streetAddress = parts[0];
        const city = parts[1];
        const stateZip = parts.slice(2).join(', ');
        
        console.log('Parsed address standard:', { streetAddress, city, stateZip });
        
        return {
          street: streetAddress,
          cityStateZip: `${city}, ${stateZip}`
        };
      }
    } else if (parts.length === 2) {
      // Fallback: "Street, City State"
      return {
        street: parts[0],
        cityStateZip: parts[1]
      };
    } else {
      // Single line address
      return {
        street: addressString,
        cityStateZip: ''
      };
    }
  };
  
  if (clientInfo) {
    // Billing info (left column) - Use custom billing address if available
    doc.setFont('helvetica', 'bold');
    doc.text(clientInfo.company_name, 20, yPos);
    doc.setFont('helvetica', 'normal');
    
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 20, yPos + 7);
      yPos += 7;
    }
    
    // Use custom billing address from quote if provided, otherwise fall back to client info address
    const billingAddress = quote.billingAddress || clientInfo.address;
    console.log('PDF Generation - Final billing address used:', billingAddress);
    
    if (billingAddress) {
      const formattedBilling = formatAddress(billingAddress);
      if (formattedBilling) {
        doc.text(formattedBilling.street, 20, yPos + 7);
        if (formattedBilling.cityStateZip) {
          doc.text(formattedBilling.cityStateZip, 20, yPos + 14);
        }
      }
    }
    
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 20, yPos + 28);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 20, yPos + 35);
    }
    
    // Service address (right column) - Let's debug this more thoroughly
    doc.setFont('helvetica', 'bold');
    doc.text(clientInfo.company_name, 110, yPos);
    doc.setFont('helvetica', 'normal');
    
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 110, yPos + 7);
    }
    
    // Enhanced debugging for service address determination
    console.log('PDF Generation - Service address determination:');
    console.log('  - quote.serviceAddress exists?', !!quote.serviceAddress);
    console.log('  - quote.serviceAddress value:', quote.serviceAddress);
    console.log('  - quote.serviceAddress type:', typeof quote.serviceAddress);
    console.log('  - quote.billingAddress exists?', !!quote.billingAddress);
    console.log('  - quote.billingAddress value:', quote.billingAddress);
    console.log('  - clientInfo.address exists?', !!clientInfo.address);
    console.log('  - clientInfo.address value:', clientInfo.address);
    
    // Determine service address with explicit checks
    let finalServiceAddress = null;
    
    // Check if serviceAddress exists and is not empty/null/undefined
    if (quote.serviceAddress && quote.serviceAddress.trim() !== '') {
      finalServiceAddress = quote.serviceAddress;
      console.log('PDF Generation - Using quote.serviceAddress:', finalServiceAddress);
    } else if (quote.billingAddress && quote.billingAddress.trim() !== '') {
      finalServiceAddress = quote.billingAddress;
      console.log('PDF Generation - Using quote.billingAddress as fallback:', finalServiceAddress);
    } else if (clientInfo.address && clientInfo.address.trim() !== '') {
      finalServiceAddress = clientInfo.address;
      console.log('PDF Generation - Using clientInfo.address as fallback:', finalServiceAddress);
    } else {
      console.log('PDF Generation - No service address found');
    }
    
    console.log('PDF Generation - Final service address to display:', finalServiceAddress);
    
    if (finalServiceAddress) {
      const formattedService = formatAddress(finalServiceAddress);
      if (formattedService) {
        doc.text(formattedService.street, 110, yPos + 7);
        if (formattedService.cityStateZip) {
          doc.text(formattedService.cityStateZip, 110, yPos + 14);
        }
      }
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
  
  // Items Section - More compact to save space
  yPos += 12;
  
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    const mrcItems = quote.quoteItems.filter(item => item.charge_type === 'MRC');
    const nrcItems = quote.quoteItems.filter(item => item.charge_type === 'NRC');
    
    // Define table structure with properly aligned columns for both MRC and NRC sections
    const colX = {
      description: 20,
      qty: 150,
      price: 165,
      total: 180
    };
    
    // Monthly Fees Section
    if (mrcItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Fees', 20, yPos);
      yPos += 10;
      
      // Table headers with background
      doc.setFillColor(240, 240, 240);
      doc.rect(colX.description, yPos - 6, 175, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(colX.description, yPos - 6, 175, 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', colX.description + 2, yPos - 1);
      doc.text('Qty', colX.qty + 2, yPos - 1);
      doc.text('Price', colX.price + 2, yPos - 1);
      doc.text('Total', colX.total + 2, yPos - 1);
      
      yPos += 4;
      
      // MRC Items with more compact layout
      doc.setFont('helvetica', 'normal');
      mrcItems.forEach((item, index) => {
        const itemName = item.item?.name || item.name || 'Monthly Service';
        
        // Get address from the item - more compact
        let addressText = '';
        if (item.address) {
          addressText = `${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}`;
        } else {
          addressText = quote.serviceAddress || quote.billingAddress || 'Service location not specified';
        }
        
        // Truncate address if too long
        if (addressText.length > 40) {
          addressText = addressText.substring(0, 37) + '...';
        }
        
        // More compact row height
        const rowHeight = 10;
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(colX.description, yPos - 3, 175, rowHeight, 'F');
        }
        
        // Main item row - description line (smaller font)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(itemName.substring(0, 35), colX.description + 2, yPos);
        
        // Address line (smaller font)
        doc.setFontSize(6);
        doc.setTextColor(80, 80, 80);
        doc.text(`Loc: ${addressText}`, colX.description + 4, yPos + 5);
        
        // Reset color and font for other columns
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        
        // Right-align the quantity, price, and total
        const qtyText = item.quantity.toString();
        const priceText = `$${Number(item.unit_price).toFixed(2)}`;
        const totalText = `$${Number(item.total_price).toFixed(2)}`;
        
        const qtyWidth = doc.getTextWidth(qtyText);
        const priceWidth = doc.getTextWidth(priceText);
        const totalWidth = doc.getTextWidth(totalText);
        
        doc.text(qtyText, colX.qty + 12 - qtyWidth, yPos);
        doc.text(priceText, colX.price + 12 - priceWidth, yPos);
        doc.text(totalText, colX.total + 12 - totalWidth, yPos);
        
        yPos += rowHeight;
      });
      
      // Total line
      yPos += 2;
      doc.setDrawColor(0, 0, 0);
      doc.line(colX.description, yPos, 195, yPos);
      yPos += 6;
      
      const mrcTotal = mrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const totalLabelText = 'Total Monthly:';
      const totalAmountText = `$${mrcTotal.toFixed(2)} USD`;
      const totalAmountWidth = doc.getTextWidth(totalAmountText);
      
      doc.text(totalLabelText, colX.price - 30, yPos);
      doc.text(totalAmountText, colX.total + 12 - totalAmountWidth, yPos);
    }
    
    // One-Time Fees - more compact
    if (nrcItems.length > 0) {
      yPos += 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const nrcTotal = nrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
      const nrcTotalText = `$${nrcTotal.toFixed(2)} USD`;
      const nrcTotalWidth = doc.getTextWidth(nrcTotalText);
      
      const colX = {
        description: 20,
        qty: 150,
        price: 165,
        total: 180
      };
      
      doc.text('One-Time Setup Fees:', colX.price - 30, yPos);
      doc.text(nrcTotalText, colX.total + 12 - nrcTotalWidth, yPos);
    }
  }
  
  // Get template content if templateId is provided
  let templateContent = '';
  if ((quote as any).templateId) {
    try {
      const { data: template, error } = await supabase
        .from('quote_templates')
        .select('content')
        .eq('id', (quote as any).templateId)
        .single();
      
      if (!error && template) {
        templateContent = template.content;
        console.log('PDF Generation - Raw template content:', templateContent);
      }
    } catch (error) {
      console.error('Error fetching template for PDF:', error);
    }
  }
  
  // Template content section (Terms & Conditions) with markdown formatting
  if (templateContent) {
    yPos += 15;
    
    // Add Terms & Conditions header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Terms & Conditions:', 20, yPos);
    yPos += 8;
    
    console.log('PDF Generation - Processing template content as markdown');
    
    // Use the new markdown parser
    const finalY = addMarkdownTextToPDF(doc, templateContent, 20, yPos, 175);
    yPos = finalY;
  }
  
  // Notes section (if space allows and on current page)
  if (quote.notes) {
    const remainingSpace = 297 - 20 - yPos; // Page height - bottom margin - current position
    
    if (remainingSpace < 25) {
      // Not enough space, add new page
      doc.addPage();
      yPos = 30;
    } else {
      yPos += 10;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 20, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(quote.notes, 175);
    doc.text(splitNotes, 20, yPos);
  }
  
  return doc;
};
