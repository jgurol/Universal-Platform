import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFRequest {
  quote: any;
  clientInfo?: any;
  salespersonName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('PDFShift Function - Request received, method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('PDFShift Function - Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { quote, clientInfo, salespersonName }: PDFRequest = requestBody;
    
    console.log('PDFShift Function - Processing quote:', quote?.id, 'with status:', quote?.status);
    console.log('PDFShift Function - Quote items count:', quote?.quoteItems?.length || 0);
    console.log('PDFShift Function - API Key configured:', !!Deno.env.get('PDFSHIFT_API_KEY'));
    console.log('PDFShift Function - Template ID:', quote?.templateId);
    
    // Initialize Supabase client to fetch system settings and template
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch company logo and settings from system_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['company_logo_url', 'company_name']);
    
    if (settingsError) {
      console.error('Error fetching system settings:', settingsError);
    }
    
    // Fetch template content if templateId is provided
    let templateContent = '';
    if (quote?.templateId) {
      console.log('PDFShift Function - Fetching template content for ID:', quote.templateId);
      const { data: template, error: templateError } = await supabase
        .from('quote_templates')
        .select('content, name')
        .eq('id', quote.templateId)
        .single();
      
      if (templateError) {
        console.error('PDFShift Function - Error fetching template:', templateError);
      } else if (template) {
        templateContent = template.content;
        console.log('PDFShift Function - Template content loaded:', template.name, 'length:', templateContent.length);
      }
    }
    
    // Extract logo URL and company name from settings
    let logoUrl = '';
    let companyName = 'California Telecom, Inc.';
    
    if (settings) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);
      
      logoUrl = settingsMap.company_logo_url || '';
      companyName = settingsMap.company_name || 'California Telecom, Inc.';
    }
    
    console.log('PDFShift Function - Logo URL configured:', !!logoUrl);
    console.log('PDFShift Function - Company name:', companyName);
    
    // Create HTML template with logo, settings, and template content
    const html = generateHTML(quote, clientInfo, salespersonName, logoUrl, companyName, templateContent);
    console.log('PDFShift Function - HTML generated, length:', html.length);
    
    // Call PDFShift API
    const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${Deno.env.get('PDFSHIFT_API_KEY')}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      }),
    });

    console.log('PDFShift Function - API Response status:', pdfShiftResponse.status);

    if (!pdfShiftResponse.ok) {
      const errorText = await pdfShiftResponse.text();
      console.error('PDFShift API error:', errorText);
      throw new Error(`PDFShift API error: ${pdfShiftResponse.status} - ${errorText}`);
    }

    // Get PDF as array buffer and convert to base64 efficiently
    const pdfBuffer = await pdfShiftResponse.arrayBuffer();
    console.log('PDFShift Function - PDF buffer size:', pdfBuffer.byteLength);
    
    // Use TextDecoder with base64 encoding for efficient conversion
    const uint8Array = new Uint8Array(pdfBuffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack issues
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const pdfBase64 = btoa(binary);
    
    console.log('PDFShift Function - PDF generated successfully, base64 length:', pdfBase64.length);
    
    return new Response(JSON.stringify({ pdf: pdfBase64 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    
  } catch (error: any) {
    console.error('PDFShift Function - Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Helper function to process HTML/Rich text content and extract images
const processRichTextContent = (content: string): { html: string; images: string[] } => {
  if (!content) return { html: '', images: [] };
  
  console.log('PDFShift Function - Processing rich text content:', content.substring(0, 200));
  
  // Extract image URLs using regex
  const imageRegex = /<img[^>]+src="([^"]*)"[^>]*>/g;
  const images: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
    console.log('PDFShift Function - Found image URL:', match[1].substring(0, 100));
  }
  
  // Convert HTML to a cleaner format for PDF
  const cleanHtml = content
    .replace(/<img[^>]*>/g, '') // Remove img tags for now, we'll handle them separately
    .replace(/<strong>(.*?)<\/strong>/g, '<b>$1</b>')
    .replace(/<em>(.*?)<\/em>/g, '<i>$1</i>')
    .replace(/<br\s*\/?>/g, '<br>')
    .replace(/<\/p><p>/g, '</p><p>')
    .replace(/&nbsp;/g, ' ')
    .trim();
    
  console.log('PDFShift Function - Processed HTML length:', cleanHtml.length);
  console.log('PDFShift Function - Found images count:', images.length);
  
  return { html: cleanHtml, images };
};

// Enhanced function to process template content specifically for terms & conditions
const processTemplateContent = (content: string): string => {
  if (!content) return '';
  
  console.log('PDFShift Function - Processing template content:', content.substring(0, 200));
  
  // More comprehensive HTML processing for template content
  let processedContent = content
    // Convert various HTML elements to appropriate formats
    .replace(/<strong>(.*?)<\/strong>/g, '<b>$1</b>')
    .replace(/<b>(.*?)<\/b>/g, '<span style="font-weight: bold;">$1</span>')
    .replace(/<em>(.*?)<\/em>/g, '<i>$1</i>')
    .replace(/<i>(.*?)<\/i>/g, '<span style="font-style: italic;">$1</span>')
    .replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration: underline;">$1</span>')
    
    // Handle headings
    .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g, '<div style="font-weight: bold; margin: 8px 0 4px 0; font-size: 11px;">$2</div>')
    
    // Handle paragraphs with proper spacing
    .replace(/<p[^>]*>(.*?)<\/p>/g, '<div style="margin: 6px 0; line-height: 1.4;">$1</div>')
    
    // Handle line breaks
    .replace(/<br\s*\/?>/g, '<br>')
    
    // Handle lists
    .replace(/<ul[^>]*>/g, '<div style="margin: 6px 0; padding-left: 16px;">')
    .replace(/<\/ul>/g, '</div>')
    .replace(/<ol[^>]*>/g, '<div style="margin: 6px 0; padding-left: 16px;">')
    .replace(/<\/ol>/g, '</div>')
    .replace(/<li[^>]*>(.*?)<\/li>/g, '<div style="margin: 2px 0; position: relative;">• $1</div>')
    
    // Handle divs
    .replace(/<div[^>]*>/g, '<div>')
    
    // Clean up entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    
    // Remove any remaining unwanted tags but keep the content
    .replace(/<\/?(?:span|font)[^>]*>/g, '')
    .replace(/<img[^>]*>/g, '') // Remove images from template content
    
    .trim();
  
  console.log('PDFShift Function - Processed template content length:', processedContent.length);
  
  return processedContent;
};

// Enhanced HTML generation function with template content support
const generateHTML = (quote: any, clientInfo?: any, salespersonName?: string, logoUrl?: string, companyName?: string, templateContent?: string): string => {
  // Extract data safely
  const quoteId = quote?.id || '';
  const quoteNumber = quote?.quoteNumber || quoteId.slice(0, 4);
  const description = quote?.description || 'Service Agreement';
  const status = quote?.status || 'pending';
  const date = quote?.date || new Date().toISOString();
  const expiresAt = quote?.expiresAt || '';
  const billingAddress = quote?.billingAddress || '';
  const serviceAddress = quote?.serviceAddress || billingAddress || '';
  
  const clientCompanyName = clientInfo?.company_name || 'Company Name';
  const contactName = clientInfo?.contact_name || 'Contact Name';
  const contactEmail = clientInfo?.email || '';
  const contactPhone = clientInfo?.phone || '';
  
  const isApproved = status === 'approved' || status === 'accepted';
  
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
  
  // Generate items HTML with proper formatting matching the interface
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
                ${items.map(item => `
                <tr>
                    <td class="description-cell">
                        <div class="item-content">
                            <div class="item-header">
                                <div class="item-name">${item.name}</div>
                                ${item.address ? `<div class="item-location">Location: ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}</div>` : ''}
                            </div>
                            ${item.processedDescription || item.images.length > 0 ? `
                            <div class="item-details">
                                ${item.images.length > 0 ? item.images.map(imgSrc => `
                                <div class="item-image-container">
                                    <img src="${imgSrc}" alt="Product Image" class="item-image">
                                </div>
                                `).join('') : ''}
                                ${item.processedDescription ? `<div class="item-description">${item.processedDescription}</div>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    </td>
                    <td class="qty-cell">${item.quantity}</td>
                    <td class="price-cell">$${item.unit_price.toFixed(2)}</td>
                    <td class="total-cell">$${item.total_price.toFixed(2)}</td>
                </tr>
                `).join('')}
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
        
        .address-block {
            flex: 1;
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
        
        .description-cell {
            width: 50%;
        }
        
        .qty-cell {
            width: 10%;
            text-align: center;
        }
        
        .price-cell {
            width: 20%;
            text-align: right;
        }
        
        .total-cell {
            width: 20%;
            text-align: right;
        }
        
        .item-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .item-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 6px;
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
            border: 1px solid #ddd;
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
        
        .template-content {
            margin: 30px 0;
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
                <td>${salespersonName || 'N/A'}</td>
            </tr>
        </table>
        
        ${isApproved ? 
          '<div class="status-approved">APPROVED</div>' : 
          '<div class="accept-button">ACCEPT AGREEMENT</div>'
        }
    </div>
    
    <div class="addresses-section">
        <div class="address-block">
            <div class="address-title">Billing Information</div>
            <div class="address-content">
                <div><strong>${clientCompanyName}</strong></div>
                <div>Jonathan Conn</div>
                <div>${billingAddress || 'Address not specified'}</div>
                ${contactPhone ? `<div>Tel: ${contactPhone}</div>` : ''}
                ${contactEmail ? `<div>Email: ${contactEmail}</div>` : ''}
            </div>
        </div>
        <div class="address-block">
            <div class="address-title">Service Address</div>
            <div class="address-content">
                <div><strong>${clientCompanyName}</strong></div>
                <div>Jonathan Conn</div>
                <div>${serviceAddress || 'Same as billing address'}</div>
                ${contactPhone ? `<div>Tel: ${contactPhone}</div>` : ''}
                ${contactEmail ? `<div>Email: ${contactEmail}</div>` : ''}
            </div>
        </div>
    </div>
    
    <div class="quote-title">${description}</div>
    
    ${generateItemsHTML(mrcItems, 'Monthly Fees')}
    ${mrcItems.length > 0 ? `<div class="total-amount">Total Monthly: $${mrcTotal.toFixed(2)} USD</div>` : ''}
    
    ${generateItemsHTML(nrcItems, 'One-Time Fees')}
    ${nrcItems.length > 0 ? `<div class="total-amount">Total One-Time: $${nrcTotal.toFixed(2)} USD</div>` : ''}
    
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

serve(handler);
