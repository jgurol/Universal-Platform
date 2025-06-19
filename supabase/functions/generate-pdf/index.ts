
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quote ${quote.quoteNumber || quote.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .quote-info {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .client-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .info-section h3 {
          color: #1e40af;
          margin-bottom: 10px;
          font-size: 16px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .items-section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #1e40af;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
          background: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        .item-name {
          font-weight: 600;
          color: #1f2937;
        }
        .item-description {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .item-location {
          font-size: 12px;
          color: #9ca3af;
          font-style: italic;
          margin-top: 2px;
        }
        .price {
          text-align: right;
          font-weight: 600;
        }
        .total-row {
          background: #1e40af !important;
          color: white;
          font-weight: 700;
          font-size: 16px;
        }
        .total-row td {
          border: none;
          padding: 15px 12px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${quote.description || (clientInfo?.company_name ? `${clientInfo.company_name} - Service Agreement` : 'Service Agreement')}</h1>
        ${quote.quoteNumber ? `<p style="margin: 10px 0; color: #6b7280;">Quote #${quote.quoteNumber}</p>` : ''}
      </div>

      <div class="quote-info">
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        ${clientInfo?.company_name ? `<strong>Company:</strong> ${clientInfo.company_name}<br>` : ''}
        ${quote.status ? `<strong>Status:</strong> ${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}<br>` : ''}
      </div>

      ${clientInfo ? `
        <div class="client-info">
          <div class="info-section">
            <h3>Client Information</h3>
            <p><strong>${clientInfo.company_name || 'N/A'}</strong></p>
            ${clientInfo.contact_name ? `<p>${clientInfo.contact_name}</p>` : ''}
            ${clientInfo.email ? `<p>${clientInfo.email}</p>` : ''}
            ${clientInfo.phone ? `<p>${clientInfo.phone}</p>` : ''}
          </div>
          <div class="info-section">
            <h3>Billing Address</h3>
            ${quote.billingAddress ? `
              <p>${quote.billingAddress}</p>
            ` : '<p>Not specified</p>'}
          </div>
        </div>
      ` : ''}

      ${mrcItems.length > 0 ? `
        <div class="items-section">
          <h2 class="section-title">Monthly Recurring Charges</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40%">Description</th>
                <th style="width: 10%; text-align: center">Qty</th>
                <th style="width: 15%; text-align: right">Unit Price</th>
                <th style="width: 15%; text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${mrcItems.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${item.name || item.item?.name || 'Monthly Service'}</div>
                    ${item.address ? `<div class="item-location">Location: ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}</div>` : ''}
                    ${(item.description || item.item?.description) ? `<div class="item-description">${stripHtml(item.description || item.item?.description || '')}</div>` : ''}
                  </td>
                  <td style="text-align: center">${item.quantity}</td>
                  <td class="price">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="price">$${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total Monthly Recurring</td>
                <td class="price">$${mrcItems.reduce((total, item) => total + Number(item.total_price), 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      ${nrcItems.length > 0 ? `
        <div class="items-section">
          <h2 class="section-title">One-Time Setup Charges</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40%">Description</th>
                <th style="width: 10%; text-align: center">Qty</th>
                <th style="width: 15%; text-align: right">Unit Price</th>
                <th style="width: 15%; text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${nrcItems.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${item.name || item.item?.name || 'Setup Fee'}</div>
                    ${item.address ? `<div class="item-location">Location: ${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}</div>` : ''}
                    ${(item.description || item.item?.description) ? `<div class="item-description">${stripHtml(item.description || item.item?.description || '')}</div>` : ''}
                  </td>
                  <td style="text-align: center">${item.quantity}</td>
                  <td class="price">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="price">$${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total One-Time Setup</td>
                <td class="price">$${nrcItems.reduce((total, item) => total + Number(item.total_price), 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>This quote is valid for 30 days from the date of issue.</p>
        <p>Thank you for your business!</p>
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
        margin: '1in',
        landscape: false,
        use_print: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDFShift] API error:', response.status, errorText);
      throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    console.log('[PDFShift] PDF generated successfully, size:', pdfBuffer.byteLength, 'bytes');
    
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.quoteNumber || quote.id}.pdf"`
      }
    });
    
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
