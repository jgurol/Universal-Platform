
import { processRichTextContent, processTemplateContent } from './contentProcessor.ts';
import { BusinessSettings } from './types.ts';

// Enhanced HTML generation function with template content support
export const generateHTML = (
  quote: any, 
  clientInfo?: any, 
  accountManagerName?: string, 
  logoUrl?: string, 
  companyName?: string, 
  templateContent?: string,
  primaryContact?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    title: string | null;
  }
): string => {
  // Extract data safely
  const quoteId = quote?.id || '';
  const quoteNumber = quote?.quoteNumber || quoteId.slice(0, 4);
  const description = quote?.description || 'Service Agreement';
  const status = quote?.status || 'pending';
  const date = quote?.date || new Date().toISOString();
  const expiresAt = quote?.expiresAt || '';
  const billingAddress = quote?.billingAddress || '';
  const serviceAddress = quote?.serviceAddress || '';
  // Extract the initial term from the quote
  const initialTerm = quote?.term || '36 Months';
  
  const clientCompanyName = clientInfo?.company_name || 'Company Name';
  
  // Use primary contact if available, with detailed logging
  let contactName = 'Contact Name';
  let contactEmail = '';
  let contactPhone = '';
  
  console.log('PDFShift Function - Processing contact info');
  console.log('PDFShift Function - Primary contact received:', primaryContact);
  console.log('PDFShift Function - Client info received:', clientInfo);
  
  if (primaryContact) {
    contactName = `${primaryContact.first_name} ${primaryContact.last_name}`;
    contactEmail = primaryContact.email || '';
    contactPhone = primaryContact.phone || '';
    console.log('PDFShift Function - Using primary contact:', contactName, 'email:', contactEmail, 'phone:', contactPhone);
  } else if (clientInfo) {
    // Only use clientInfo if no primary contact found
    contactName = clientInfo.contact_name || 'Contact Name';
    contactEmail = clientInfo.email || '';
    contactPhone = clientInfo.phone || '';
    console.log('PDFShift Function - Using clientInfo contact (fallback):', contactName, 'email:', contactEmail, 'phone:', contactPhone);
  } else {
    console.log('PDFShift Function - No contact information available');
  }
  
  const isApproved = status === 'approved' || status === 'accepted';
  
  // Use the account manager name passed from the main function
  const finalAccountManagerName = accountManagerName || 'N/A';
  
  console.log('PDFShift Function - Final account manager name in HTML generation:', finalAccountManagerName);
  
  // Process quote items with enhanced description and image handling
  let mrcItems = [];
  let nrcItems = [];
  let mrcTotal = 0;
  let nrcTotal = 0;
  
  if (Array.isArray(quote?.quoteItems)) {
    console.log('PDFShift Function - Processing', quote.quoteItems.length, 'quote items');
    
    for (const item of quote.quoteItems) {
      // Process description content
      const itemDescription = item?.description || item?.item?.description || '';
      const { html: processedDescription, images } = processRichTextContent(itemDescription);
      
      console.log('PDFShift Function - Item:', item?.item?.name || item?.name, 'has description length:', itemDescription.length, 'images:', images.length);
      
      const itemData = {
        name: item?.item?.name || item?.name || 'Service',
        description: itemDescription,
        processedDescription,
        images,
        quantity: item?.quantity || 1,
        unit_price: parseFloat(item?.unit_price) || 0,
        total_price: parseFloat(item?.total_price) || 0,
        charge_type: item?.charge_type || 'MRC',
        address: item?.address
      };
      
      if (itemData.charge_type === 'MRC') {
        mrcItems.push(itemData);
        mrcTotal += itemData.total_price;
      } else {
        nrcItems.push(itemData);
        nrcTotal += itemData.total_price;
      }
    }
  }
  
  console.log('PDFShift Function - Processed items - MRC:', mrcItems.length, 'NRC:', nrcItems.length);
  
  // Generate logo HTML if available
  const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Company Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;">` : `<div class="company-logo-text">${companyName || 'California Telecom, Inc.'}</div>`;
  
  // Process template content for display with enhanced formatting
  const processedTemplateContent = templateContent ? processTemplateContent(templateContent) : '';
  
  // Check if service address is provided and different from billing
  const hasServiceAddress = serviceAddress && serviceAddress.trim() !== '' && serviceAddress !== billingAddress;
  
  // Generate items HTML with proper formatting matching the interface and page break prevention
  const generateItemsHTML = (items: any[], sectionTitle: string) => {
    if (items.length === 0) return '';
    
    return `
    <div class="items-section">
        <div class="section-title">${sectionTitle}</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th class="description-cell">Description</th>
                    <th class="qty-cell">Qty</th>
                    <th class="price-cell">Price</th>
                    <th class="total-cell">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                  const hasDescriptionContent = (item.processedDescription && item.processedDescription.trim()) || item.images.length > 0;
                  
                  return `
                <tr class="item-row">
                    <td class="description-cell">
                        <div class="item-content">
                            <div class="item-header${hasDescriptionContent ? ' with-content' : ''}">
                                <div class="item-name">${item.name}</div>
                                ${item.address ? `<div class="item-location">Location: ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}</div>` : ''}
                            </div>
                            ${hasDescriptionContent ? `
                            <div class="item-details">
                                ${item.images.length > 0 ? item.images.map(imgSrc => `
                                <div class="item-image-container">
                                    <img src="${imgSrc}" alt="Product Image" class="item-image">
                                </div>
                                `).join('') : ''}
                                ${item.processedDescription && item.processedDescription.trim() ? `<div class="item-description">${item.processedDescription}</div>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    </td>
                    <td class="qty-cell">${item.quantity}</td>
                    <td class="price-cell">$${item.unit_price.toFixed(2)}</td>
                    <td class="total-cell">$${item.total_price.toFixed(2)}</td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    </div>
    `;
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Agreement ${quoteNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 10px;
        }
        
        .company-logo-text {
            font-size: 11px;
            font-weight: bold;
            color: #1f4e79;
            display: flex;
            align-items: center;
        }
        
        .company-logo-text::before {
            content: "CALIFORNIA";
            margin-right: 8px;
        }
        
        .company-logo-text::after {
            content: "TELECOM";
            color: #1f4e79;
        }
        
        .company-info {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
        }
        
        .agreement-title {
            font-size: 11px;
            font-weight: normal;
            color: #999;
            text-align: right;
        }
        
        .company-details {
            margin-bottom: 20px;
        }
        
        .company-details div {
            margin-bottom: 2px;
        }
        
        .agreement-box {
            position: absolute;
            right: 20px;
            top: 80px;
            width: 180px;
            border: 1px solid #ddd;
            background: #f9f9f9;
            padding: 8px;
            font-size: 11px;
        }
        
        .agreement-box table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .agreement-box td {
            padding: 2px 4px;
            border-bottom: 1px solid #eee;
        }
        
        .agreement-box td:first-child {
            font-weight: bold;
            width: 50%;
        }
        
        .accept-button {
            background: #28a745;
            color: white;
            text-align: center;
            padding: 8px;
            margin-top: 10px;
            font-weight: normal;
            border-radius: 3px;
        }
        
        .addresses-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            gap: 20px;
        }
        
        .addresses-section.single-address {
            justify-content: flex-start;
        }
        
        .address-block {
            flex: 1;
        }
        
        .address-block.single {
            flex: none;
            max-width: 300px;
        }
        
        .address-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 11px;
        }
        
        .address-content {
            font-size: 11px;
            line-height: 1.5;
        }
        
        .quote-title {
            font-size: 11px;
            font-weight: bold;
            margin: 30px 0 20px 0;
            color: #333;
        }
        
        .items-section {
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 11px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: left;
            font-size: 11px;
            vertical-align: top;
        }
        
        .items-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        .item-row {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .description-cell {
            width: 60%;
        }
        
        .qty-cell {
            width: 8%;
            text-align: center;
        }
        
        .price-cell {
            width: 16%;
            text-align: right;
        }
        
        .total-cell {
            width: 16%;
            text-align: right;
        }
        
        .item-content {
            display: flex;
            flex-direction: column;
        }
        
        .item-header {
            /* No default spacing */
        }
        
        .item-header.with-content {
            border-bottom: 1px solid #eee;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 11px;
            color: #333;
            margin-bottom: 3px;
        }
        
        .item-location {
            font-size: 11px;
            color: #666;
        }
        
        .item-details {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }
        
        .item-image-container {
            flex-shrink: 0;
        }
        
        .item-image {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
            border-radius: 4px;
            background: white;
        }
        
        .item-description {
            flex: 1;
            font-size: 11px !important;
            color: #555;
            line-height: 1.4;
            word-break: normal;
            overflow-wrap: break-word;
            white-space: normal;
        }
        
        .item-description * {
            font-size: 11px !important;
            font-family: Arial, sans-serif !important;
            word-break: normal !important;
            overflow-wrap: break-word !important;
        }
        
        .item-description p {
            margin: 4px 0;
            font-size: 11px !important;
            word-break: normal;
            overflow-wrap: break-word;
        }
        
        .item-description strong, .item-description b {
            font-weight: bold;
            font-size: 11px !important;
        }
        
        .item-description em, .item-description i {
            font-style: italic;
            font-size: 11px !important;
        }
        
        .item-description div {
            font-size: 11px !important;
            word-break: normal;
            overflow-wrap: break-word;
        }
        
        .item-description span {
            font-size: 11px !important;
            word-break: normal;
            overflow-wrap: break-word;
        }
        
        .item-description ul, .item-description ol {
            font-size: 11px !important;
            margin: 4px 0;
            padding-left: 20px;
        }
        
        .item-description li {
            font-size: 11px !important;
            margin: 2px 0;
        }
        
        .item-description h1, .item-description h2, .item-description h3, 
        .item-description h4, .item-description h5, .item-description h6 {
            font-size: 11px !important;
            font-weight: bold;
            margin: 4px 0;
        }
        
        .initial-term-section {
            margin: 30px 0 20px 0;
            padding: 12px;
            border: 1px solid #ddd;
            background: #f8f9fa;
        }
        
        .initial-term-title {
            font-weight: bold;
            margin-bottom: 6px;
            font-size: 11px;
            color: #333;
        }
        
        .initial-term-value {
            font-size: 11px;
            color: #555;
        }
        
        .template-content {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            background: #f9f9f9;
        }
        
        .template-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 12px;
            color: #333;
        }
        
        .template-text {
            font-size: 10px !important;
            line-height: 1.5;
            color: #555;
            font-family: Arial, sans-serif !important;
        }
        
        .template-text * {
            font-size: 10px !important;
            font-family: Arial, sans-serif !important;
            line-height: 1.4 !important;
        }
        
        .template-text div {
            margin: 6px 0 !important;
            font-size: 10px !important;
        }
        
        .template-text p {
            margin: 6px 0 !important;
            font-size: 10px !important;
        }
        
        .template-text ul, .template-text ol {
            font-size: 10px !important;
            margin: 6px 0 !important;
            padding-left: 16px !important;
        }
        
        .template-text li {
            font-size: 10px !important;
            margin: 2px 0 !important;
        }
        
        .template-text span {
            font-size: 10px !important;
        }
        
        .template-text b, .template-text strong {
            font-weight: bold !important;
            font-size: 10px !important;
        }
        
        .template-text i, .template-text em {
            font-style: italic !important;
            font-size: 10px !important;
        }
        
        .template-text br {
            line-height: 1.4 !important;
        }
        
        .total-amount {
            text-align: right;
            font-weight: bold;
            margin-top: 10px;
            font-size: 11px;
        }
        
        .status-approved {
            background: #28a745;
            color: white;
            text-align: center;
            padding: 8px;
            font-weight: normal;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            ${logoHtml}
            <div class="company-details">
                <div>${companyName || 'California Telecom, Inc.'}</div>
                <div>14538 Central Ave</div>
                <div>Chino, CA 91710</div>
                <div>United States</div>
                <div style="margin-top: 8px;">
                    <div>Tel: 213-270-1349</div>
                    <div>Fax: 213-232-3304</div>
                </div>
            </div>
        </div>
        <div class="agreement-title">Agreement</div>
    </div>
    
    <div class="agreement-box">
        <table>
            <tr>
                <td>Agreement</td>
                <td>${quoteNumber} v2</td>
            </tr>
            <tr>
                <td>Date:</td>
                <td>${new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
            </tr>
            <tr>
                <td>Expires</td>
                <td>${expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}</td>
            </tr>
            <tr>
                <td>Account Manager</td>
                <td>${finalAccountManagerName}</td>
            </tr>
        </table>
        
        ${isApproved ? 
          '<div class="status-approved">APPROVED</div>' : 
          '<div class="accept-button">ACCEPT AGREEMENT</div>'
        }
    </div>
    
    <div class="addresses-section${hasServiceAddress ? '' : ' single-address'}">
        <div class="address-block${hasServiceAddress ? '' : ' single'}">
            <div class="address-title">Billing Information</div>
            <div class="address-content">
                <div><strong>${clientCompanyName}</strong></div>
                <div>${contactName}</div>
                <div>${billingAddress || 'Address not specified'}</div>
                ${contactPhone ? `<div>Tel: ${contactPhone}</div>` : ''}
                ${contactEmail ? `<div>Email: ${contactEmail}</div>` : ''}
            </div>
        </div>
        ${hasServiceAddress ? `
        <div class="address-block">
            <div class="address-title">Service Address</div>
            <div class="address-content">
                <div><strong>${clientCompanyName}</strong></div>
                <div>${contactName}</div>
                <div>${serviceAddress}</div>
                ${contactPhone ? `<div>Tel: ${contactPhone}</div>` : ''}
                ${contactEmail ? `<div>Email: ${contactEmail}</div>` : ''}
            </div>
        </div>
        ` : ''}
    </div>
    
    <div class="quote-title">${description}</div>
    
    ${generateItemsHTML(mrcItems, 'Monthly Fees')}
    ${mrcItems.length > 0 ? `<div class="total-amount">Total Monthly: $${mrcTotal.toFixed(2)} USD</div>` : ''}
    
    ${generateItemsHTML(nrcItems, 'One-Time Fees')}
    ${nrcItems.length > 0 ? `<div class="total-amount">Total One-Time: $${nrcTotal.toFixed(2)} USD</div>` : ''}
    
    <div class="initial-term-section">
        <div class="initial-term-title">Initial Term</div>
        <div class="initial-term-value">${initialTerm}</div>
    </div>
    
    ${processedTemplateContent ? `
    <div class="template-content">
        <div class="template-title">Terms & Conditions</div>
        <div class="template-text">${processedTemplateContent}</div>
    </div>
    ` : ''}
    
    ${isApproved ? '' : `
    <div style="margin-top: 30px; text-align: center;">
        <div class="accept-button">ACCEPT AGREEMENT</div>
    </div>
    `}
</body>
</html>
  `;
};
