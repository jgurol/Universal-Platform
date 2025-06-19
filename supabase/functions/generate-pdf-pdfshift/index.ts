
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote, clientInfo, salespersonName }: PDFRequest = await req.json();
    
    console.log('PDFShift - Generating PDF for quote:', quote.id);
    
    // Create HTML template
    const html = generateHTML(quote, clientInfo, salespersonName);
    
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
        margin: '0.5in',
        print_background: true,
        wait_for: 1000
      }),
    });

    if (!pdfShiftResponse.ok) {
      const errorText = await pdfShiftResponse.text();
      console.error('PDFShift API error:', errorText);
      throw new Error(`PDFShift API error: ${pdfShiftResponse.status} - ${errorText}`);
    }

    // Get PDF as base64
    const pdfBuffer = await pdfShiftResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    console.log('PDFShift - PDF generated successfully');
    
    return new Response(JSON.stringify({ pdf: pdfBase64 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    
  } catch (error: any) {
    console.error('PDFShift generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

const generateHTML = (quote: any, clientInfo?: any, salespersonName?: string): string => {
  const mrcItems = quote.quoteItems?.filter((item: any) => item.charge_type === 'MRC') || [];
  const nrcItems = quote.quoteItems?.filter((item: any) => item.charge_type === 'NRC') || [];
  
  const mrcTotal = mrcItems.reduce((total: number, item: any) => total + (Number(item.total_price) || 0), 0);
  const nrcTotal = nrcItems.reduce((total: number, item: any) => total + (Number(item.total_price) || 0), 0);
  
  const billingAddress = quote.billingAddress || '';
  const serviceAddress = quote.serviceAddress || billingAddress || '';
  
  const isApproved = quote.status === 'approved' || quote.status === 'accepted';
  
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
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 3px solid #007bff;
            margin-bottom: 20px;
        }
        
        .company-info {
            text-align: center;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        
        .company-details {
            font-size: 14px;
            color: #666;
        }
        
        .quote-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .quote-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        
        .quote-number {
            font-size: 16px;
            color: #666;
        }
        
        .status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        
        .status-approved {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .addresses-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .address-box {
            width: 48%;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #fafafa;
        }
        
        .address-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .address-content {
            font-size: 12px;
            line-height: 1.5;
        }
        
        .items-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background: #007bff;
            color: white;
            padding: 12px 8px;
            font-weight: bold;
            text-align: left;
            border: 1px solid #0056b3;
        }
        
        .items-table td {
            padding: 10px 8px;
            border: 1px solid #ddd;
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
            background: #f0f8ff !important;
        }
        
        .total-row td {
            border-top: 2px solid #007bff;
        }
        
        .accept-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            text-align: center;
        }
        
        .accept-button {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px;
        }
        
        .accepted-notice {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #c3e6cb;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        
        @media print {
            .accept-button {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">California Telecom</div>
            <div class="company-details">
                1063 McGaw Avenue, Irvine, CA 92614<br>
                Phone: (949) 474-7900 | Fax: (949) 474-7901
            </div>
        </div>
    </div>
    
    <div class="quote-header">
        <div>
            <div class="quote-title">${quote.description || 'Service Agreement'}</div>
            <div class="quote-number">Quote #${quote.quoteNumber || quote.id.slice(0, 8)}</div>
        </div>
        <div class="status-badge ${isApproved ? 'status-approved' : 'status-pending'}">
            ${isApproved ? 'Approved' : 'Pending'}
        </div>
    </div>
    
    <div class="addresses-section">
        <div class="address-box">
            <div class="address-title">Bill To:</div>
            <div class="address-content">
                ${clientInfo?.company_name || 'Company Name'}<br>
                ${clientInfo?.contact_name || 'Contact Name'}<br>
                ${billingAddress || 'Address not specified'}
            </div>
        </div>
        <div class="address-box">
            <div class="address-title">Service Address:</div>
            <div class="address-content">
                ${serviceAddress || 'Same as billing address'}
            </div>
        </div>
    </div>
    
    ${mrcItems.length > 0 ? `
    <div class="items-section">
        <div class="section-title">Monthly Recurring Charges</div>
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
                        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
                    <td>$${Number(item.total_price || 0).toFixed(2)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3"><strong>Total Monthly Charges:</strong></td>
                    <td><strong>$${mrcTotal.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}
    
    ${nrcItems.length > 0 ? `
    <div class="items-section">
        <div class="section-title">One-Time Charges</div>
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
                        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
                    <td>$${Number(item.total_price || 0).toFixed(2)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3"><strong>Total One-Time Charges:</strong></td>
                    <td><strong>$${nrcTotal.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="accept-section">
        ${isApproved ? `
        <div class="accepted-notice">
            <strong>✓ Agreement Accepted</strong><br>
            This agreement has been digitally accepted and is now active.
        </div>
        ` : `
        <p style="margin-bottom: 20px;">
            <strong>Ready to proceed?</strong> Click the button below to accept this agreement.
        </p>
        <a href="${req.headers.get('origin') || 'https://your-app-url.com'}/accept-quote/${quote.id}" class="accept-button">
            🖊️ ACCEPT AGREEMENT
        </a>
        <p style="margin-top: 15px; font-size: 11px; color: #666;">
            By clicking "Accept Agreement", you agree to the terms and conditions outlined in this quote.
        </p>
        `}
    </div>
    
    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Prepared by: ${salespersonName || 'Sales Team'}</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
  `;
};

serve(handler);
