
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
    
    // Create HTML template
    const html = generateHTML(quote, clientInfo, salespersonName, req);
    console.log('PDFShift Function - HTML generated, length:', html.length);
    
    // Call PDFShift API with corrected parameters
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
        margin: '0.5in',
        wait_for: "1000ms"
        // Fixed: wait_for should be a string with units, and removed unsupported print_background
      }),
    });

    console.log('PDFShift Function - API Response status:', pdfShiftResponse.status);

    if (!pdfShiftResponse.ok) {
      const errorText = await pdfShiftResponse.text();
      console.error('PDFShift API error:', errorText);
      throw new Error(`PDFShift API error: ${pdfShiftResponse.status} - ${errorText}`);
    }

    // Get PDF as base64
    const pdfBuffer = await pdfShiftResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
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

const generateHTML = (quote: any, clientInfo?: any, salespersonName?: string, req?: Request): string => {
  const mrcItems = quote.quoteItems?.filter((item: any) => item.charge_type === 'MRC') || [];
  const nrcItems = quote.quoteItems?.filter((item: any) => item.charge_type === 'NRC') || [];
  
  const mrcTotal = mrcItems.reduce((total: number, item: any) => total + (Number(item.total_price) || 0), 0);
  const nrcTotal = nrcItems.reduce((total: number, item: any) => total + (Number(item.total_price) || 0), 0);
  
  const billingAddress = quote.billingAddress || '';
  const serviceAddress = quote.serviceAddress || billingAddress || '';
  
  const isApproved = quote.status === 'approved' || quote.status === 'accepted';
  
  // Get origin from request headers or use fallback
  const origin = req?.headers.get('origin') || 'https://your-app-url.com';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quote ${quote.quoteNumber || quote.id.slice(0, 8)}</title>
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
        
        .accept-section {
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            text-align: center;
            border: 2px solid #dee2e6;
        }
        
        .accept-button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 18px;
            margin: 15px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
        }
        
        .accepted-notice {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            color: #155724;
            padding: 25px;
            border-radius: 15px;
            border: 2px solid #c3e6cb;
            font-size: 18px;
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
            .accept-button { -webkit-print-color-adjust: exact; color-adjust: exact; }
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
            <div class="quote-title">${quote.description || 'Service Agreement'}</div>
            <div class="quote-number">Quote #${quote.quoteNumber || quote.id.slice(0, 8)}</div>
        </div>
        <div class="status-badge ${isApproved ? 'status-approved' : 'status-pending'}">
            ${isApproved ? '✅ Approved' : '⏳ Pending'}
        </div>
    </div>
    
    <div class="addresses-section">
        <div class="address-box">
            <div class="address-title">📋 Bill To:</div>
            <div class="address-content">
                <strong>${clientInfo?.company_name || 'Company Name'}</strong><br>
                ${clientInfo?.contact_name || 'Contact Name'}<br>
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
                ${mrcItems.map((item: any) => `
                <tr>
                    <td>
                        <strong>${item.item?.name || item.name || 'Service'}</strong>
                        ${item.description ? `<br><small style="color: #666; font-style: italic;">${item.description}</small>` : ''}
                    </td>
                    <td><span class="highlight">${item.quantity}</span></td>
                    <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
                    <td><strong>$${Number(item.total_price || 0).toFixed(2)}</strong></td>
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
                ${nrcItems.map((item: any) => `
                <tr>
                    <td>
                        <strong>${item.item?.name || item.name || 'Setup Fee'}</strong>
                        ${item.description ? `<br><small style="color: #666; font-style: italic;">${item.description}</small>` : ''}
                    </td>
                    <td><span class="highlight">${item.quantity}</span></td>
                    <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
                    <td><strong>$${Number(item.total_price || 0).toFixed(2)}</strong></td>
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
    
    <div class="accept-section">
        ${isApproved ? `
        <div class="accepted-notice">
            <strong>✅ Agreement Accepted!</strong><br>
            This agreement has been digitally accepted and is now active.
        </div>
        ` : `
        <p style="margin-bottom: 25px; font-size: 16px;">
            <strong>🚀 Ready to proceed?</strong> Click the button below to accept this agreement.
        </p>
        <a href="${origin}/accept-quote/${quote.id}" class="accept-button">
            ✍️ ACCEPT AGREEMENT
        </a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
            By clicking "Accept Agreement", you agree to the terms and conditions outlined in this quote.
        </p>
        `}
    </div>
    
    <div class="footer">
        <p><strong>Generated on ${new Date().toLocaleDateString()}</strong> | Prepared by: <em>${salespersonName || 'Sales Team'}</em></p>
        <p>✨ Thank you for choosing California Telecom! ✨</p>
    </div>
</body>
</html>
  `;
};

serve(handler);
