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
  
  // Enhanced debugging for approval status
  console.log('PDF Generation - Starting PDF generation for quote:', quote.id);
  console.log('PDF Generation - Quote status:', quote.status);
  console.log('PDF Generation - Quote acceptance status:', (quote as any).acceptanceStatus);
  console.log('PDF Generation - Quote accepted_at:', (quote as any).accepted_at);
  console.log('PDF Generation - Quote accepted_by:', (quote as any).acceptedBy);
  
  // More comprehensive approval check
  const isApproved = quote.status === 'approved' || 
                     quote.status === 'accepted' ||
                     (quote as any).acceptanceStatus === 'accepted' ||
                     !!(quote as any).accepted_at ||
                     !!(quote as any).acceptedBy;
  
  console.log('PDF Generation - Is quote approved?', isApproved);
  
  // IMPROVED ACCEPTANCE DETAILS QUERY
  let acceptanceDetails = null;
  if (isApproved) {
    console.log('PDF Generation - Quote is approved, fetching acceptance details...');
    try {
      // Try multiple queries to find acceptance data
      const { data: acceptance, error } = await supabase
        .from('quote_acceptances')
        .select('*')
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('PDF Generation - Acceptance query result:', { acceptance, error });
      
      if (!error && acceptance) {
        acceptanceDetails = acceptance;
        console.log('PDF Generation - Found acceptance details:', {
          client_name: acceptance.client_name,
          client_email: acceptance.client_email,
          accepted_at: acceptance.accepted_at,
          ip_address: acceptance.ip_address,
          user_agent: acceptance.user_agent,
          has_signature: !!acceptance.signature_data
        });
      } else {
        console.log('PDF Generation - No acceptance details in quote_acceptances table');
        
        // Also check if the quote itself has acceptance data
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select('accepted_at, accepted_by, acceptance_status')
          .eq('id', quote.id)
          .single();
          
        console.log('PDF Generation - Quote acceptance data from quotes table:', { quoteData, quoteError });
      }
    } catch (error) {
      console.error('PDF Generation - Error fetching acceptance details:', error);
    }
  }
  
  // Load business information from database
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
      const img = new Image();
      img.onload = function() {
        const maxWidth = 60;
        const maxHeight = 30;
        const aspectRatio = img.width / img.height;
        
        let logoWidth = maxWidth;
        let logoHeight = maxWidth / aspectRatio;
        
        if (logoHeight > maxHeight) {
          logoHeight = maxHeight;
          logoWidth = maxHeight * aspectRatio;
        }
        
        doc.addImage(businessSettings.logoUrl, 'JPEG', 20, 15, logoWidth, logoHeight);
        logoYOffset = logoHeight;
      };
      img.src = businessSettings.logoUrl;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      logoYOffset = 30;
    } catch (error) {
      console.error('Error loading logo:', error);
      logoYOffset = 0;
    }
  }
  
  // Document type in top right
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Agreement', 160, 18);
  
  // Company Information (left side)
  const companyInfoY = 40;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  let currentY = companyInfoY;
  
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
  
  if (businessSettings.businessFax && businessSettings.businessFax.trim() !== '') {
    doc.text(`Fax: ${businessSettings.businessFax}`, 20, currentY);
  }
  
  // Agreement details box (right side)
  const boxX = 125;
  const boxY = 12;
  const boxWidth = 70;
  const boxHeight = 40;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
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
  
  // Billing Information and Service Address sections
  let yPos = 70;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Information', 20, yPos);
  doc.text('Service Address', 110, yPos);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos + 2, 85, yPos + 2);
  doc.line(110, yPos + 2, 175, yPos + 2);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Helper function to format address
  const formatAddress = (addressString: string) => {
    if (!addressString) return null;
    
    const parts = addressString.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      const secondPart = parts[1];
      const suitePattern = /^(suite|unit|apt|apartment|ste|floor|fl|#)\s/i;
      
      if (suitePattern.test(secondPart)) {
        const streetAddress = `${parts[0]}, ${parts[1]}`;
        const city = parts[2];
        const stateZip = parts.slice(3).join(', ');
        
        return {
          street: streetAddress,
          cityStateZip: `${city}${stateZip ? ', ' + stateZip : ''}`
        };
      } else {
        const streetAddress = parts[0];
        const city = parts[1];
        const stateZip = parts.slice(2).join(', ');
        
        return {
          street: streetAddress,
          cityStateZip: `${city}, ${stateZip}`
        };
      }
    } else if (parts.length === 2) {
      return {
        street: parts[0],
        cityStateZip: parts[1]
      };
    } else {
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
    
    const billingAddress = quote.billingAddress || clientInfo.address;
    
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
    
    // Service address (right column)
    const rightColYPos = 78;
    doc.setFont('helvetica', 'bold');
    doc.text(clientInfo.company_name, 110, rightColYPos);
    doc.setFont('helvetica', 'normal');
    
    let rightYOffset = 0;
    if (clientInfo.contact_name) {
      doc.text(clientInfo.contact_name, 110, rightColYPos + 7);
      rightYOffset = 7;
    }
    
    let finalServiceAddress = null;
    
    if (quote.serviceAddress && quote.serviceAddress.trim() !== '') {
      finalServiceAddress = quote.serviceAddress;
    } else if (quote.billingAddress && quote.billingAddress.trim() !== '') {
      finalServiceAddress = quote.billingAddress;
    } else if (clientInfo.address && clientInfo.address.trim() !== '') {
      finalServiceAddress = clientInfo.address;
    }
    
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
  
  // Agreement status indicator - IMPROVED CENTERING
  const buttonX = 110;
  const buttonY = 120;
  const buttonWidth = 85;
  const buttonHeight = 12;
  
  if (isApproved) {
    console.log('PDF Generation - Adding APPROVED status to PDF');
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Calculate text width for perfect centering
    const approvedText = 'APPROVED';
    const textWidth = doc.getTextWidth(approvedText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(approvedText, centeredX, buttonY + 8);
  } else {
    console.log('PDF Generation - Adding ACCEPT AGREEMENT button to PDF');
    const acceptanceUrl = `${window.location.origin}/accept-quote/${quote.id}`;
    
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Calculate text width for perfect centering
    const buttonText = 'ACCEPT AGREEMENT';
    const textWidth = doc.getTextWidth(buttonText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(buttonText, centeredX, buttonY + 8);
    
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: acceptanceUrl });
  }
  
  // Quote Title
  yPos = 145;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const quoteTitle = quote.description || (clientInfo?.company_name ? `${clientInfo.company_name} - Service Agreement` : 'Service Agreement');
  doc.text(quoteTitle, 20, yPos);
  
  // Items Section
  yPos += 12;
  
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    const mrcItems = quote.quoteItems.filter(item => item.charge_type === 'MRC');
    const nrcItems = quote.quoteItems.filter(item => item.charge_type === 'NRC');
    
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
      
      doc.setFont('helvetica', 'normal');
      mrcItems.forEach((item, index) => {
        const itemName = item.item?.name || item.name || 'Monthly Service';
        
        let addressText = '';
        if (item.address) {
          addressText = `${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}`;
        } else {
          addressText = quote.serviceAddress || quote.billingAddress || 'Service location not specified';
        }
        
        if (addressText.length > 40) {
          addressText = addressText.substring(0, 37) + '...';
        }
        
        const rowHeight = 10;
        
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(colX.description, yPos - 3, 175, rowHeight, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(itemName.substring(0, 35), colX.description + 2, yPos);
        
        doc.setFontSize(6);
        doc.setTextColor(80, 80, 80);
        doc.text(`Loc: ${addressText}`, colX.description + 4, yPos + 5);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        
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
    
    // One-Time Fees
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
      
      if (error) {
        console.error('Error fetching template for PDF:', error);
      } else if (template) {
        templateContent = template.content;
      }
    } catch (error) {
      console.error('Error fetching template for PDF:', error);
    }
  }
  
  // Template content section (Terms & Conditions)
  if (templateContent && templateContent.trim()) {
    yPos += 15;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Terms & Conditions:', 20, yPos);
    yPos += 8;
    
    const finalY = addMarkdownTextToPDF(doc, templateContent, 20, yPos, 175);
    yPos = finalY;
  }
  
  // Notes section
  if (quote.notes) {
    const remainingSpace = 297 - 20 - yPos;
    
    if (remainingSpace < 25) {
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
    yPos += Array.isArray(splitNotes) ? splitNotes.length * 4 : 4;
  }
  
  // COMPREHENSIVE DIGITAL ACCEPTANCE EVIDENCE SECTION
  if (isApproved) {
    console.log('PDF Generation - Adding comprehensive digital acceptance evidence section');
    console.log('PDF Generation - Acceptance details available:', !!acceptanceDetails);
    
    const remainingSpace = 297 - 20 - yPos;
    
    if (remainingSpace < 140) {
      doc.addPage();
      yPos = 30;
      console.log('PDF Generation - Added new page for acceptance evidence');
    } else {
      yPos += 20;
    }
    
    // Add prominent separator
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(20, yPos, 195, yPos);
    yPos += 15;
    
    // Header with background
    doc.setFillColor(240, 248, 255);
    doc.rect(20, yPos - 8, 175, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, yPos - 8, 175, 20);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 50, 100);
    doc.text('✓ DIGITAL ACCEPTANCE EVIDENCE', 25, yPos + 3);
    yPos += 25;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // ALWAYS SHOW ACCEPTANCE DETAILS WHEN APPROVED
    if (acceptanceDetails) {
      console.log('PDF Generation - Displaying COMPLETE acceptance details from database');
      
      // Client information with better spacing
      doc.setFont('helvetica', 'bold');
      doc.text('Accepted by:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(acceptanceDetails.client_name || 'Unknown', 85, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email Address:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(acceptanceDetails.client_email || 'Unknown', 85, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Acceptance Date:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      const acceptedDate = acceptanceDetails.accepted_at ? 
        new Date(acceptanceDetails.accepted_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }) : 'Unknown';
      doc.text(acceptedDate, 85, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('IP Address:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(acceptanceDetails.ip_address || 'Not recorded', 85, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Browser/Device:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      const userAgent = acceptanceDetails.user_agent || 'Not recorded';
      const splitUserAgent = doc.splitTextToSize(userAgent, 110);
      doc.text(splitUserAgent, 85, yPos);
      yPos += Array.isArray(splitUserAgent) ? splitUserAgent.length * 4 + 6 : 10;
      
      // Digital signature with enhanced display
      if (acceptanceDetails.signature_data) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Digital Signature:', 25, yPos);
        yPos += 8;
        
        try {
          // Add signature with better formatting
          const signatureHeight = 35;
          const signatureWidth = 120;
          
          // Draw signature border with label
          doc.setDrawColor(100, 100, 100);
          doc.setLineWidth(0.5);
          doc.rect(25, yPos, signatureWidth, signatureHeight);
          
          // Add signature image
          doc.addImage(acceptanceDetails.signature_data, 'PNG', 26, yPos + 1, signatureWidth - 2, signatureHeight - 2);
          
          // Add signature verification text
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          doc.text('Legally binding digital signature captured at time of acceptance', 25, yPos + signatureHeight + 5);
          
          yPos += signatureHeight + 10;
          
          console.log('PDF Generation - Digital signature added successfully');
        } catch (error) {
          console.error('PDF Generation - Error adding signature:', error);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('[Digital signature on file - unable to display in PDF]', 25, yPos);
          yPos += 8;
        }
      } else {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Digital Signature:', 25, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('[No digital signature recorded]', 25, yPos);
        yPos += 10;
      }
      
    } else {
      console.log('PDF Generation - No detailed acceptance data found, showing basic approved status');
      
      // Show basic status when no detailed acceptance data is available
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text('Agreement has been digitally accepted by client', 85, yPos);
      yPos += 10;
      
      if ((quote as any).accepted_by) {
        doc.setFont('helvetica', 'bold');
        doc.text('Accepted by:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text((quote as any).accepted_by, 85, yPos);
        yPos += 10;
      }
      
      if ((quote as any).accepted_at) {
        doc.setFont('helvetica', 'bold');
        doc.text('Date:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        const acceptedDate = new Date((quote as any).accepted_at).toLocaleString();
        doc.text(acceptedDate, 85, yPos);
        yPos += 10;
      }
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Detailed acceptance evidence may be available in system records', 25, yPos);
      yPos += 12;
    }
    
    // Legal notice with better formatting
    yPos += 5;
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPos, 175, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, yPos, 175, 20);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('This document contains legally binding digital acceptance evidence.', 25, yPos + 7);
    doc.text('All acceptance data is stored securely and can be verified upon request.', 25, yPos + 13);
    
    console.log('PDF Generation - Digital acceptance evidence section completed');
  }
  
  return doc;
};
