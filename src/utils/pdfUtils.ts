
import jsPDF from 'jspdf';
import { Quote, ClientInfo } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';
import { addMarkdownTextToPDF } from './markdownToPdf';

// Helper function to load settings from database
const loadSettingsFromDatabase = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('Error loading settings for PDF:', error);
      return null;
    }

    if (data) {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);

      return {
        companyName: settingsMap.company_name || 'California Telecom, Inc.',
        businessAddress: settingsMap.business_address || '14538 Central Ave, Chino, CA 91710, United States',
        businessPhone: settingsMap.business_phone || '213-270-1349',
        businessFax: settingsMap.business_fax || '',
        showCompanyNameOnPDF: settingsMap.show_company_name_on_pdf !== 'false',
        logoUrl: settingsMap.company_logo_url || ''
      };
    }
  } catch (error) {
    console.error('Error loading settings for PDF:', error);
  }
  
  // Fallback to default values
  return {
    companyName: 'California Telecom, Inc.',
    businessAddress: '14538 Central Ave, Chino, CA 91710, United States',
    businessPhone: '213-270-1349',
    businessFax: '',
    showCompanyNameOnPDF: true,
    logoUrl: ''
  };
};

export const generateQuotePDF = async (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  const doc = new jsPDF();
  
  // Debug logging - let's see exactly what we're getting
  console.log('PDF Generation - Full quote object received:', quote);
  console.log('PDF Generation - Quote serviceAddress:', quote.serviceAddress);
  console.log('PDF Generation - Quote billingAddress:', quote.billingAddress);
  console.log('PDF Generation - ClientInfo object:', clientInfo);
  console.log('PDF Generation - Template ID from quote:', (quote as any).templateId);
  
  // Load business information from database instead of localStorage
  const businessSettings = await loadSettingsFromDatabase();
  
  // Parse business address
  const addressParts = businessSettings.businessAddress.split(',').map(part => part.trim());
  const streetAddress = addressParts[0] || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts.slice(2).join(', ') || '';
  
  // Load and add company logo if available
  let logoYOffset = 0;
  
  if (businessSettings.logoUrl) {
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
        doc.addImage(businessSettings.logoUrl, 'JPEG', 20, 15, logoWidth, logoHeight);
        logoYOffset = logoHeight;
      };
      img.src = businessSettings.logoUrl;
      
      // Wait a moment for the image to load
      await new Promise(resolve => setTimeout(resolve, 100));
      logoYOffset = 30;
    } catch (error) {
      console.error('Error loading logo:', error);
      logoYOffset = 0;
    }
  }
  
  // Document type in top right - black color
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Agreement', 160, 18); // Moved up slightly
  
  // Company Information (left side) - positioned right below logo with tighter spacing
  const companyInfoY = 40; // Moved up from 50
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  let currentY = companyInfoY;
  
  // Only show company name if setting is enabled
  if (businessSettings.showCompanyNameOnPDF) {
    doc.setFont('helvetica', 'bold');
    doc.text(businessSettings.companyName, 20, currentY);
    currentY += 3;
  }
  
  doc.setFont('helvetica', 'normal');
  doc.text(streetAddress, 20, currentY);
  currentY += 3;
  
  if (city) {
    doc.text(city + (stateZip ? ', ' + stateZip : ''), 20, currentY);
    currentY += 3;
  }
  
  doc.text(`Tel: ${businessSettings.businessPhone}`, 20, currentY);
  currentY += 3;
  
  // Only show fax if it exists and is not empty
  if (businessSettings.businessFax && businessSettings.businessFax.trim() !== '') {
    doc.text(`Fax: ${businessSettings.businessFax}`, 20, currentY);
  }
  
  // Agreement details box (right side) - moved higher
  const boxX = 125;
  const boxY = 12; // Moved up from 15
  const boxWidth = 70;
  const boxHeight = 40;
  
  // Draw box with gray background
  doc.setFillColor(245, 245, 245);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  // Agreement details inside box
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
  
  // Billing Information and Service Address sections - moved up and better aligned
  let yPos = 70; // Moved up from 85
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
    // Billing info (left column)
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
    
    // Service address (right column) - reset yPos for right column
    const rightColYPos = 78; // Aligned with billing info
    doc.setFont('helvetica', 'bold');
    doc.text(clientInfo.company_name, 110, rightColYPos);
    doc.setFont('helvetica', 'normal');
    
    let rightYOffset = 0;
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 110, rightColYPos + 7);
      rightYOffset = 7;
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
        doc.text(formattedService.street, 110, rightColYPos + 7 + rightYOffset);
        if (formattedService.cityStateZip) {
          doc.text(formattedService.cityStateZip, 110, rightColYPos + 14 + rightYOffset);
        }
      }
    }
    
    if (clientInfo.phone) {
      doc.text(`Tel: ${clientInfo.phone}`, 110, rightColYPos + 28);
    }
    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, 110, rightColYPos + 35);
    }
  }
  
  // Accept Agreement button (green box) - positioned closer to address sections
  const buttonX = 110; // Aligned with service address column
  const buttonY = 120; // Moved up, closer to address sections
  const buttonWidth = 85; // Made wider to fit under service address
  const buttonHeight = 12;
  
  // Create clickable link to acceptance page - FIXED URL GENERATION
  const currentHost = window.location.origin;
  const acceptanceUrl = `${currentHost}/accept-quote/${quote.id}`;
  console.log('PDF Generation - Accept Agreement URL:', acceptanceUrl);
  
  doc.setFillColor(76, 175, 80); // Green color
  doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ACCEPT AGREEMENT', buttonX + 12, buttonY + 8);
  
  // Add clickable link to the button area
  doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: acceptanceUrl });
  
  // Quote Title - positioned after accept button
  yPos = 145; // Moved up for better spacing
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
    console.log('PDF Generation - Loading template with ID:', (quote as any).templateId);
    try {
      const { data: template, error } = await supabase
        .from('quote_templates')
        .select('content')
        .eq('id', (quote as any).templateId)
        .single();
      
      if (error) {
        console.error('Error fetching template for PDF:', error);
      } else if (template) {
        templateContent = template.content;
        console.log('PDF Generation - Template loaded successfully, content length:', templateContent?.length || 0);
        console.log('PDF Generation - Template content preview:', templateContent?.substring(0, 200) || 'No content');
      } else {
        console.log('PDF Generation - No template data returned');
      }
    } catch (error) {
      console.error('Error fetching template for PDF:', error);
    }
  } else {
    console.log('PDF Generation - No template ID provided in quote');
  }
  
  // Template content section (Terms & Conditions) with markdown formatting
  if (templateContent && templateContent.trim()) {
    console.log('PDF Generation - Adding template content to PDF');
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
  } else {
    console.log('PDF Generation - No template content to add');
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
