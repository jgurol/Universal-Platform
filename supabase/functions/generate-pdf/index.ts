import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PDFSHIFT_API_URL = 'https://api.pdfshift.io/v3/convert/pdf';

interface Quote {
  id: string;
  quoteNumber?: string;
  description?: string;
  status?: string;
  billingAddress?: string;
  serviceAddress?: string;
  quoteItems?: Array<{
    id: string;
    name?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    charge_type: 'MRC' | 'NRC';
    item?: {
      name?: string;
      description?: string;
    };
    address?: {
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    };
  }>;
}

interface ClientInfo {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
}

const generateQuoteHTML = (quote: Quote, clientInfo?: ClientInfo): string => {
  const mrcItems = quote.quoteItems?.filter(item => item.charge_type === 'MRC') || [];
  const nrcItems = quote.quoteItems?.filter(item => item.charge_type === 'NRC') || [];
  
  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  };

  // Calculate totals
  const mrcTotal = mrcItems.reduce((total, item) => total + Number(item.total_price), 0);
  const nrcTotal = nrcItems.reduce((total, item) => total + Number(item.total_price), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Agreement ${quote.quoteNumber || quote.id}</title>
      <style>
        @page {
          margin: 0.5in;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 15px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 8px;
        }
        
        .company-details {
          font-size: 10px;
          line-height: 1.2;
          margin-bottom: 0;
        }
        
        .agreement-box {
          text-align: center;
          border: 2px solid #000;
          padding: 8px;
          margin-left: 20px;
          min-width: 120px;
        }
        
        .agreement-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .agreement-details {
          font-size: 10px;
          text-align: left;
        }
        
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 30px;
        }
        
        .info-box {
          flex: 1;
        }
        
        .info-box h3 {
          font-size: 12px;
          font-weight: bold;
          margin: 0 0 8px 0;
          text-decoration: underline;
        }
        
        .info-box p {
          margin: 2px 0;
          font-size: 10px;
        }
        
        .accept-button {
          background: #22c55e;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
          margin-top: 10px;
        }
        
        .service-title {
          font-size: 16px;
          font-weight: bold;
          margin: 25px 0 15px 0;
          text-align: center;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          margin: 20px 0 10px 0;
          text-decoration: underline;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 1px solid #000;
        }
        
        .items-table th {
          background: #f5f5f5;
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          font-size: 11px;
        }
        
        .items-table td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 10px;
          vertical-align: top;
        }
        
        .items-table .center {
          text-align: center;
        }
        
        .items-table .right {
          text-align: right;
        }
        
        .item-description {
          margin-top: 4px;
          font-size: 9px;
          color: #333;
        }
        
        .item-details {
          margin-left: 15px;
          font-size: 9px;
          margin-top: 3px;
        }
        
        .item-details li {
          margin-bottom: 1px;
        }
        
        .total-row {
          font-weight: bold;
          background: #f9f9f9;
        }
        
        .final-accept-section {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
        }
      </style>
    </head>
    <body>
      <!-- Header Section -->
      <div class="header">
        <div class="company-info">
          <div class="company-name">YOUR COMPANY NAME</div>
          <div class="company-details">
            Your Company Address<br>
            City, State ZIP<br>
            United States<br><br>
            Tel: XXX-XXX-XXXX<br>
            Email: contact@yourcompany.com
          </div>
        </div>
        <div class="agreement-box">
          <div class="agreement-title">Agreement</div>
          <div class="agreement-details">
            <strong>Agreement:</strong> ${quote.quoteNumber || quote.id}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Expires:</strong> ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}<br>
            <strong>Account Manager:</strong> ${clientInfo?.contact_name || 'N/A'}
          </div>
          <button class="accept-button">ACCEPT AGREEMENT</button>
        </div>
      </div>

      <!-- Client Information Section -->
      <div class="info-section">
        <div class="info-box">
          <h3>Billing Information</h3>
          ${clientInfo ? `
            <p><strong>${clientInfo.company_name || 'N/A'}</strong></p>
            ${clientInfo.contact_name ? `<p>${clientInfo.contact_name}</p>` : ''}
            ${quote.billingAddress ? quote.billingAddress.split(',').map(line => `<p>${line.trim()}</p>`).join('') : '<p>Billing address not specified</p>'}
            ${clientInfo.phone ? `<p>Tel: ${clientInfo.phone}</p>` : ''}
            ${clientInfo.email ? `<p>Email: ${clientInfo.email}</p>` : ''}
          ` : '<p>Client information not available</p>'}
        </div>
        <div class="info-box">
          <h3>Service Address</h3>
          ${quote.serviceAddress ? 
            quote.serviceAddress.split(',').map(line => `<p>${line.trim()}</p>`).join('') : 
            (quote.billingAddress ? 
              quote.billingAddress.split(',').map(line => `<p>${line.trim()}</p>`).join('') : 
              '<p>Service address not specified</p>'
            )
          }
        </div>
      </div>

      <!-- Service Title -->
      <div class="service-title">
        ${quote.description || `${clientInfo?.company_name || 'Customer'} - Internet Circuits`}
      </div>

      <!-- Monthly Fees Section -->
      ${mrcItems.length > 0 ? `
        <div class="section-title">Monthly Fees</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th class="center" style="width: 10%;">Qty</th>
              <th class="right" style="width: 20%;">Price</th>
              <th class="right" style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${mrcItems.map(item => {
              const itemName = item.name || item.item?.name || 'Monthly Service';
              const description = item.description || item.item?.description || '';
              const cleanDescription = stripHtml(description);
              
              return `
                <tr>
                  <td>
                    <strong>${itemName}</strong>
                    ${cleanDescription ? `<div class="item-description">${cleanDescription}</div>` : ''}
                    ${item.address ? `
                      <div class="item-description">
                        Location: ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}
                      </div>
                    ` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="right">$${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3" class="right"><strong>Total Monthly</strong></td>
              <td class="right"><strong>$${mrcTotal.toFixed(2)} USD</strong></td>
            </tr>
          </tbody>
        </table>
      ` : ''}

      <!-- One-Time Setup Fees Section -->
      ${nrcItems.length > 0 ? `
        <div class="section-title">One-Time Setup Fees</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th class="center" style="width: 10%;">Qty</th>
              <th class="right" style="width: 20%;">Price</th>
              <th class="right" style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${nrcItems.map(item => {
              const itemName = item.name || item.item?.name || 'Setup Fee';
              const description = item.description || item.item?.description || '';
              const cleanDescription = stripHtml(description);
              
              return `
                <tr>
                  <td>
                    <strong>${itemName}</strong>
                    ${cleanDescription ? `<div class="item-description">${cleanDescription}</div>` : ''}
                    ${item.address ? `
                      <div class="item-description">
                        Location: ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}
                      </div>
                    ` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="right">$${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3" class="right"><strong>Total One-Time Setup</strong></td>
              <td class="right"><strong>$${nrcTotal.toFixed(2)} USD</strong></td>
            </tr>
          </tbody>
        </table>
      ` : ''}

      <!-- Final Accept Button -->
      <div class="final-accept-section">
        <button class="accept-button">ACCEPT AGREEMENT</button>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PDFShift] Starting PDF generation via Edge Function');
    
    const apiKey = Deno.env.get('VITE_PDFSHIFT_API_KEY');
    
    if (!apiKey) {
      console.error('[PDFShift] API key not found in environment variables');
      throw new Error('PDFShift API key not configured. Please add VITE_PDFSHIFT_API_KEY to your Supabase secrets.');
    }

    console.log('[PDFShift] API key found, parsing request body...');

    const { quote, clientInfo } = await req.json();
    
    if (!quote) {
      throw new Error('Quote data is required');
    }

    console.log('[PDFShift] Quote data received, generating HTML...');
    
    // Generate the HTML content for the quote
    const htmlContent = generateQuoteHTML(quote, clientInfo);
    
    console.log('[PDFShift] HTML generated, calling PDFShift API...');
    
    const response = await fetch(PDFSHIFT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: htmlContent,
        format: 'A4',
        margin: '0.5in',
        landscape: false,
        use_print: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDFShift] API error:', response.status, errorText);
      throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
    }

    // Get the PDF as ArrayBuffer and convert to base64
    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    console.log('[PDFShift] PDF generated successfully, size:', pdfBytes.length, 'bytes');
    
    // Convert to base64 for JSON transport
    const base64String = btoa(String.fromCharCode(...pdfBytes));
    
    // Return the PDF as base64 in JSON response
    return new Response(
      JSON.stringify({ 
        pdf: base64String,
        size: pdfBytes.length 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
    
  } catch (error) {
    console.error('[PDFShift] Error generating PDF via Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

serve(handler);
