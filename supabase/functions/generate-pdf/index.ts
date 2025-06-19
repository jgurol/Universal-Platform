
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

  // Calculate totals
  const mrcTotal = mrcItems.reduce((total, item) => total + Number(item.total_price), 0);
  const nrcTotal = nrcItems.reduce((total, item) => total + Number(item.total_price), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quote ${quote.quoteNumber || quote.id}</title>
      <style>
        @page {
          margin: 0.75in;
          size: A4;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
        }
        
        .header h1 {
          color: #1e40af;
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
        }
        
        .quote-number {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
        
        .quote-info {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 25px;
          border: 1px solid #e5e7eb;
        }
        
        .quote-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .quote-info-row:last-child {
          margin-bottom: 0;
        }
        
        .quote-info strong {
          color: #374151;
        }
        
        .client-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }
        
        .info-box h3 {
          color: #1e40af;
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
        }
        
        .info-box p {
          margin: 0 0 6px 0;
          font-size: 11px;
          line-height: 1.4;
        }
        
        .info-box p:last-child {
          margin-bottom: 0;
        }
        
        .company-name {
          font-weight: 600;
          color: #1f2937;
        }
        
        .items-section {
          margin-bottom: 25px;
        }
        
        .section-title {
          background: #1e40af;
          color: white;
          padding: 10px 15px;
          margin: 0 0 0 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
          border: 1px solid #d1d5db;
        }
        
        .items-table th {
          background: #f3f4f6;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          border-bottom: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
        }
        
        .items-table th:last-child {
          border-right: none;
        }
        
        .items-table th.text-center {
          text-align: center;
        }
        
        .items-table th.text-right {
          text-align: right;
        }
        
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          vertical-align: top;
        }
        
        .items-table td:last-child {
          border-right: none;
        }
        
        .items-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .item-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .item-location {
          font-size: 9px;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 4px;
        }
        
        .item-description {
          font-size: 10px;
          color: #4b5563;
          line-height: 1.3;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .total-row {
          background: #1e40af !important;
          color: white;
          font-weight: 700;
        }
        
        .total-row td {
          border-color: #1e40af;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 10px;
        }
        
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${quote.description || (clientInfo?.company_name ? `${clientInfo.company_name} - Service Agreement` : 'Service Agreement')}</h1>
        ${quote.quoteNumber ? `<p class="quote-number">Quote #${quote.quoteNumber}</p>` : ''}
      </div>

      <div class="quote-info">
        <div class="quote-info-row">
          <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
          <span><strong>Status:</strong> ${quote.status ? quote.status.charAt(0).toUpperCase() + quote.status.slice(1) : 'Draft'}</span>
        </div>
      </div>

      ${clientInfo ? `
        <div class="client-section">
          <div class="info-box">
            <h3>Client Information</h3>
            <p class="company-name">${clientInfo.company_name || 'N/A'}</p>
            ${clientInfo.contact_name ? `<p>${clientInfo.contact_name}</p>` : ''}
            ${clientInfo.email ? `<p>${clientInfo.email}</p>` : ''}
            ${clientInfo.phone ? `<p>${clientInfo.phone}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>Billing Address</h3>
            ${quote.billingAddress ? `
              <p>${quote.billingAddress.split(',').map(line => line.trim()).join('<br>')}</p>
            ` : '<p>Not specified</p>'}
          </div>
        </div>
      ` : ''}

      ${mrcItems.length > 0 ? `
        <div class="items-section">
          <h2 class="section-title">Monthly Recurring Charges</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%">Description</th>
                <th class="text-center" style="width: 8%">Qty</th>
                <th class="text-right" style="width: 21%">Unit Price</th>
                <th class="text-right" style="width: 21%">Total</th>
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
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="text-right">$${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3"><strong>Total Monthly Recurring</strong></td>
                <td class="text-right"><strong>$${mrcTotal.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      ${nrcItems.length > 0 ? `
        <div class="items-section">
          <h2 class="section-title">One-Time Setup Charges</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%">Description</th>
                <th class="text-center" style="width: 8%">Qty</th>
                <th class="text-right" style="width: 21%">Unit Price</th>
                <th class="text-right" style="width: 21%">Total</th>
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
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">$${Number(item.unit_price).toFixed(2)}</td>
                  <td class="text-right">$${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3"><strong>Total One-Time Setup</strong></td>
                <td class="text-right"><strong>$${nrcTotal.toFixed(2)}</strong></td>
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
