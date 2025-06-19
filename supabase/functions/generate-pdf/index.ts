
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
          margin: 0.75in;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #000;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .company-details {
          font-size: 11px;
          line-height: 1.4;
          color: #333;
        }
        
        .agreement-box {
          text-align: center;
          border: 3px solid #000;
          padding: 15px;
          margin-left: 30px;
          min-width: 160px;
          background: #f8f8f8;
        }
        
        .agreement-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        
        .agreement-details {
          font-size: 11px;
          text-align: left;
          line-height: 1.6;
        }
        
        .agreement-details strong {
          font-weight: bold;
        }
        
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 40px;
        }
        
        .info-box {
          flex: 1;
          padding: 15px;
          background: #f9f9f9;
          border: 1px solid #ddd;
        }
        
        .info-box h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 12px 0;
          text-decoration: underline;
          color: #000;
        }
        
        .info-box p {
          margin: 4px 0;
          font-size: 11px;
          line-height: 1.4;
        }
        
        .accept-button {
          background: #4CAF50;
          color: white;
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 12px;
          margin-top: 15px;
          cursor: pointer;
          text-transform: uppercase;
        }
        
        .service-title {
          font-size: 18px;
          font-weight: bold;
          margin: 30px 0 20px 0;
          text-align: center;
          color: #000;
          text-transform: uppercase;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin: 25px 0 15px 0;
          text-decoration: underline;
          color: #000;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          border: 2px solid #000;
        }
        
        .items-table th {
          background: #e8e8e8;
          border: 1px solid #000;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
        }
        
        .items-table td {
          border: 1px solid #000;
          padding: 10px 8px;
          font-size: 11px;
          vertical-align: top;
          line-height: 1.3;
        }
        
        .items-table .center {
          text-align: center;
        }
        
        .items-table .right {
          text-align: right;
        }
        
        .item-description {
          margin-top: 6px;
          font-size: 10px;
          color: #555;
          font-style: italic;
        }
        
        .total-row {
          font-weight: bold;
          background: #f0f0f0;
          font-size: 12px;
        }
        
        .total-row td {
          padding: 15px 8px;
          border-top: 2px solid #000;
        }
        
        .final-accept-section {
          text-align: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #000;
        }
        
        .final-accept-button {
          background: #4CAF50;
          color: white;
          padding: 15px 30px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          text-transform: uppercase;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .location-info {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
          font-style: italic;
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
            City, State ZIP Code<br>
            United States<br><br>
            <strong>Tel:</strong> (XXX) XXX-XXXX<br>
            <strong>Email:</strong> contact@yourcompany.com<br>
            <strong>Website:</strong> www.yourcompany.com
          </div>
        </div>
        <div class="agreement-box">
          <div class="agreement-title">Agreement</div>
          <div class="agreement-details">
            <strong>Agreement #:</strong><br>${quote.quoteNumber || quote.id}<br><br>
            <strong>Date:</strong><br>${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}<br><br>
            <strong>Expires:</strong><br>${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}<br><br>
            <strong>Account Manager:</strong><br>${clientInfo?.contact_name || 'N/A'}
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
            ${clientInfo.phone ? `<p><strong>Tel:</strong> ${clientInfo.phone}</p>` : ''}
            ${clientInfo.email ? `<p><strong>Email:</strong> ${clientInfo.email}</p>` : ''}
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
        ${quote.description || `${clientInfo?.company_name || 'Customer'} - Internet Services Agreement`}
      </div>

      <!-- Monthly Fees Section -->
      ${mrcItems.length > 0 ? `
        <div class="section-title">Monthly Recurring Charges</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 45%;">Service Description</th>
              <th class="center" style="width: 8%;">Qty</th>
              <th class="right" style="width: 15%;">Unit Price</th>
              <th class="right" style="width: 15%;">Monthly Total</th>
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
                      <div class="location-info">
                        <strong>Service Location:</strong> ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}
                      </div>
                    ` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="right"><strong>$${Number(item.total_price).toFixed(2)}</strong></td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3" class="right"><strong>TOTAL MONTHLY RECURRING CHARGES</strong></td>
              <td class="right"><strong>$${mrcTotal.toFixed(2)} USD</strong></td>
            </tr>
          </tbody>
        </table>
      ` : ''}

      <!-- One-Time Setup Fees Section -->
      ${nrcItems.length > 0 ? `
        <div class="section-title">One-Time Installation & Setup Fees</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 45%;">Service Description</th>
              <th class="center" style="width: 8%;">Qty</th>
              <th class="right" style="width: 15%;">Unit Price</th>
              <th class="right" style="width: 15%;">One-Time Total</th>
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
                      <div class="location-info">
                        <strong>Service Location:</strong> ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}
                      </div>
                    ` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="right"><strong>$${Number(item.total_price).toFixed(2)}</strong></td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3" class="right"><strong>TOTAL ONE-TIME CHARGES</strong></td>
              <td class="right"><strong>$${nrcTotal.toFixed(2)} USD</strong></td>
            </tr>
          </tbody>
        </table>
      ` : ''}

      <!-- Final Accept Button -->
      <div class="final-accept-section">
        <button class="final-accept-button">ACCEPT AGREEMENT</button>
        <p style="margin-top: 20px; font-size: 11px; color: #666;">
          By accepting this agreement, you agree to the terms and conditions outlined above.
        </p>
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
