
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
    
    // Create HTML template with minimal data extraction to avoid circular references
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

// Simplified HTML generation function
const generateHTML = (quote: any, clientInfo?: any, salespersonName?: string): string => {
  // Extract only the data we need to avoid circular references
  const quoteId = quote?.id || '';
  const quoteNumber = quote?.quoteNumber || quoteId.slice(0, 8);
  const description = quote?.description || 'Service Agreement';
  const status = quote?.status || 'pending';
  const date = quote?.date || new Date().toISOString();
  const billingAddress = quote?.billingAddress || '';
  const serviceAddress = quote?.serviceAddress || billingAddress || '';
  
  const companyName = clientInfo?.company_name || 'Company Name';
  const contactName = clientInfo?.contact_name || 'Contact Name';
  
  const isApproved = status === 'approved' || status === 'accepted';
  
  // Process quote items safely
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
    <title>Quote ${quoteNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .company-details {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .quote-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #667eea;
        }
        
        .quote-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .quote-number {
            font-size: 18px;
            color: #666;
            margin-top: 5px;
        }
        
        .status-badge {
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 14px;
        }
        
        .status-approved {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
            border: 2px solid #ffeaa7;
        }
        
        .addresses-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .address-box {
            padding: 20px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            background: #f8f9fa;
        }
        
        .address-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 15px;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 8px;
        }
        
        .address-content {
            font-size: 14px;
            line-height: 1.8;
        }
        
        .items-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #495057;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .items-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            font-weight: bold;
            text-align: left;
            font-size: 14px;
        }
        
        .items-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
        }
        
        .items-table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .items-table tbody tr:hover {
            background: #e3f2fd;
        }
        
        .total-row {
            font-weight: bold;
            background: #e8f4fd !important;
            font-size: 16px;
        }
        
        .total-row td {
            border-top: 3px solid #667eea;
            padding: 20px 12px;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        
        .highlight {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">🌟 California Telecom</div>
        <div class="company-details">
            📍 1063 McGaw Avenue, Irvine, CA 92614<br>
            📞 (949) 474-7900 | 📠 (949) 474-7901
        </div>
    </div>
    
    <div class="quote-header">
        <div>
            <div class="quote-title">${description}</div>
            <div class="quote-number">Quote #${quoteNumber}</div>
        </div>
        <div class="status-badge ${isApproved ? 'status-approved' : 'status-pending'}">
            ${isApproved ? '✅ Approved' : '⏳ Pending'}
        </div>
    </div>
    
    <div class="addresses-section">
        <div class="address-box">
            <div class="address-title">📋 Bill To:</div>
            <div class="address-content">
                <strong>${companyName}</strong><br>
                ${contactName}<br>
                ${billingAddress || 'Address not specified'}
            </div>
        </div>
        <div class="address-box">
            <div class="address-title">🏢 Service Address:</div>
            <div class="address-content">
                ${serviceAddress || 'Same as billing address'}
            </div>
        </div>
    </div>
    
    ${mrcItems.length > 0 ? `
    <div class="items-section">
        <div class="section-title">💰 Monthly Recurring Charges</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%">Description</th>
                    <th style="width: 10%">Qty</th>
                    <th style="width: 20%">Unit Price</th>
                    <th style="width: 20%">Total</th>
                </tr>
            </thead>
            <tbody>
                ${mrcItems.map(item => `
                <tr>
                    <td>
                        <strong>${item.name}</strong>
                        ${item.description ? `<br><small style="color: #666; font-style: italic;">${item.description}</small>` : ''}
                    </td>
                    <td><span class="highlight">${item.quantity}</span></td>
                    <td>$${item.unit_price.toFixed(2)}</td>
                    <td><strong>$${item.total_price.toFixed(2)}</strong></td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3"><strong>💵 Total Monthly Charges:</strong></td>
                    <td><strong>$${mrcTotal.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}
    
    ${nrcItems.length > 0 ? `
    <div class="items-section">
        <div class="section-title">🔧 One-Time Charges</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%">Description</th>
                    <th style="width: 10%">Qty</th>
                    <th style="width: 20%">Unit Price</th>
                    <th style="width: 20%">Total</th>
                </tr>
            </thead>
            <tbody>
                ${nrcItems.map(item => `
                <tr>
                    <td>
                        <strong>${item.name}</strong>
                        ${item.description ? `<br><small style="color: #666; font-style: italic;">${item.description}</small>` : ''}
                    </td>
                    <td><span class="highlight">${item.quantity}</span></td>
                    <td>$${item.unit_price.toFixed(2)}</td>
                    <td><strong>$${item.total_price.toFixed(2)}</strong></td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3"><strong>💸 Total One-Time Charges:</strong></td>
                    <td><strong>$${nrcTotal.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        <p><strong>Generated on ${new Date().toLocaleDateString()}</strong> | Prepared by: <em>${salespersonName || 'Sales Team'}</em></p>
        <p>✨ Thank you for choosing California Telecom! ✨</p>
    </div>
</body>
</html>
  `;
};

serve(handler);
