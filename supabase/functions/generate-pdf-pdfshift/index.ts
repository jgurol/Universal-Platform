
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log('PDFShift Function - API Key configured:', !!Deno.env.get('PDFSHIFT_API_KEY'));
    
    // Create HTML template with original design
    const html = generateHTML(quote, clientInfo, salespersonName);
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
    
    // Use Deno's built-in encoder for efficient base64 conversion
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdfBase64 = btoa(Array.from(uint8Array, byte => String.fromCharCode(byte)).join(''));
    
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

// HTML generation function matching the original design
const generateHTML = (quote: any, clientInfo?: any, salespersonName?: string): string => {
  // Extract data safely
  const quoteId = quote?.id || '';
  const quoteNumber = quote?.quoteNumber || quoteId.slice(0, 4);
  const description = quote?.description || 'Service Agreement';
  const status = quote?.status || 'pending';
  const date = quote?.date || new Date().toISOString();
  const expiresAt = quote?.expiresAt || '';
  const billingAddress = quote?.billingAddress || '';
  const serviceAddress = quote?.serviceAddress || billingAddress || '';
  
  const companyName = clientInfo?.company_name || 'Company Name';
  const contactName = clientInfo?.contact_name || 'Contact Name';
  const contactEmail = clientInfo?.email || '';
  const contactPhone = clientInfo?.phone || '';
  
  const isApproved = status === 'approved' || status === 'accepted';
  
  // Process quote items
  let mrcItems = [];
  let nrcItems = [];
  let mrcTotal = 0;
  let nrcTotal = 0;
  
  if (Array.isArray(quote?.quoteItems)) {
    for (const item of quote.quoteItems) {
      const itemData = {
        name: item?.item?.name || item?.name || 'Service',
        description: item?.description || '',
        quantity: item?.quantity || 1,
        unit_price: parseFloat(item?.unit_price) || 0,
        total_price: parseFloat(item?.total_price) || 0,
        charge_type: item?.charge_type || 'MRC'
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
        
        .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #1f4e79;
            display: flex;
            align-items: center;
        }
        
        .company-logo::before {
            content: "CALIFORNIA";
            margin-right: 8px;
        }
        
        .company-logo::after {
            content: "TELECOM";
            color: #1f4e79;
        }
        
        .company-info {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
        }
        
        .agreement-title {
            font-size: 16px;
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
            font-size: 10px;
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
            font-weight: bold;
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
            font-size: 12px;
        }
        
        .address-content {
            font-size: 10px;
            line-height: 1.5;
        }
        
        .quote-title {
            font-size: 14px;
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
            font-size: 12px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            text-align: left;
            font-size: 10px;
        }
        
        .items-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        .items-table .description-cell {
            width: 50%;
        }
        
        .items-table .qty-cell {
            width: 10%;
            text-align: center;
        }
        
        .items-table .price-cell {
            width: 20%;
            text-align: right;
        }
        
        .items-table .total-cell {
            width: 20%;
            text-align: right;
        }
        
        .item-details {
            font-size: 9px;
            color: #666;
            margin-top: 2px;
        }
        
        .total-row {
            font-weight: bold;
            background: #f8f9fa;
        }
        
        .total-amount {
            text-align: right;
            font-weight: bold;
            margin-top: 10px;
            font-size: 12px;
        }
        
        .status-approved {
            background: #28a745;
            color: white;
            text-align: center;
            padding: 8px;
            font-weight: bold;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-logo"></div>
            <div class="company-details">
                <div>California Telecom, Inc.</div>
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
                <div><strong>${companyName}</strong></div>
                <div>Jonathan Conn</div>
                <div>${billingAddress || 'Address not specified'}</div>
                ${contactPhone ? `<div>Tel: ${contactPhone}</div>` : ''}
                ${contactEmail ? `<div>Email: ${contactEmail}</div>` : ''}
            </div>
        </div>
        <div class="address-block">
            <div class="address-title">Service Address</div>
            <div class="address-content">
                <div><strong>${companyName}</strong></div>
                <div>Jonathan Conn</div>
                <div>${serviceAddress || 'Same as billing address'}</div>
                ${contactPhone ? `<div>Tel: ${contactPhone}</div>` : ''}
                ${contactEmail ? `<div>Email: ${contactEmail}</div>` : ''}
            </div>
        </div>
    </div>
    
    <div class="quote-title">${description}</div>
    
    ${mrcItems.length > 0 ? `
    <div class="items-section">
        <div class="section-title">Monthly Fees</div>
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
                ${mrcItems.map(item => `
                <tr>
                    <td class="description-cell">
                        <div><strong>${item.name}</strong></div>
                        ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
                    </td>
                    <td class="qty-cell">${item.quantity}</td>
                    <td class="price-cell">$${item.unit_price.toFixed(2)}</td>
                    <td class="total-cell">$${item.total_price.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="total-amount">Total Monthly: $${mrcTotal.toFixed(2)} USD</div>
    </div>
    ` : ''}
    
    ${nrcItems.length > 0 ? `
    <div class="items-section">
        <div class="section-title">One-Time Fees</div>
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
                ${nrcItems.map(item => `
                <tr>
                    <td class="description-cell">
                        <div><strong>${item.name}</strong></div>
                        ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
                    </td>
                    <td class="qty-cell">${item.quantity}</td>
                    <td class="price-cell">$${item.unit_price.toFixed(2)}</td>
                    <td class="total-cell">$${item.total_price.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="total-amount">Total One-Time: $${nrcTotal.toFixed(2)} USD</div>
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
