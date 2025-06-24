import { processRichTextContent } from './utils.ts';

export const generateHTML = (
  quote: any,
  clientInfo: any,
  accountManagerName: string,
  logoUrl: string,
  companyName: string,
  templateContent: string,
  primaryContact?: any,
  acceptanceDetails?: any
) => {
  console.log('PDFShift Function - Final account manager name in HTML generation:', accountManagerName);
  console.log('PDFShift Function - Acceptance details in HTML generation:', !!acceptanceDetails);
  
  // Company Contact Information
  let contactSection = '';
  if (clientInfo) {
    let contactInfo = '';
    if (primaryContact) {
      contactInfo = `
        <div class="client-info">
          <h3>Contact Information</h3>
          <p><strong>Company:</strong> ${clientInfo.company_name}</p>
          <p><strong>Contact Name:</strong> ${primaryContact.first_name} ${primaryContact.last_name}</p>
          ${primaryContact.email ? `<p><strong>Email:</strong> ${primaryContact.email}</p>` : ''}
          ${primaryContact.phone ? `<p><strong>Phone:</strong> ${primaryContact.phone}</p>` : ''}
        </div>
      `;
    } else {
      contactInfo = `
        <div class="client-info">
          <h3>Client Information</h3>
          <p><strong>Company:</strong> ${clientInfo.company_name}</p>
        </div>
      `;
    }
    contactSection = contactInfo;
  }

  // Process quote items
  let quoteItemsHtml = '';
  let mrcTotal = 0;
  let nrcTotal = 0;

  if (quote?.quoteItems && quote.quoteItems.length > 0) {
    quoteItemsHtml = quote.quoteItems.map(item => {
      const itemTotal = item.quantity * item.unit_price;
      if (item.charge_type === 'MRC') {
        mrcTotal += itemTotal;
      } else {
        nrcTotal += itemTotal;
      }

      return `
        <tr>
          <td>${item.item?.name || 'N/A'} - ${item.item?.description || ''}</td>
          <td>${item.quantity}</td>
          <td>$${item.unit_price.toFixed(2)}</td>
          <td>${item.charge_type}</td>
          <td>$${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  } else {
    quoteItemsHtml = '<tr><td colspan="5">No items in this quote.</td></tr>';
  }

  // Process template content
  const processedTemplateContent = templateContent ? processRichTextContent(templateContent) : '';

  // Generate digital signature section if quote is approved and has acceptance details
  let digitalSignatureSection = '';
  const isApproved = quote?.status === 'approved' || quote?.status === 'accepted' || !!quote?.acceptedAt;
  
  if (isApproved && acceptanceDetails) {
    console.log('PDFShift Function - Adding digital signature section to HTML');
    
    digitalSignatureSection = `
      <div class="signature-section" style="margin-top: 40px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          Digital Signature & Acceptance Evidence
        </h2>
        
        <p style="margin-bottom: 20px; color: #374151; font-size: 14px;">
          This document serves as evidence of digital acceptance of the above agreement.
        </p>
        
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #374151;">Accepted by:</td>
              <td style="padding: 8px 0; color: #1f2937;">${acceptanceDetails.clientName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937;">${acceptanceDetails.clientEmail || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date & Time:</td>
              <td style="padding: 8px 0; color: #1f2937;">${new Date(acceptanceDetails.acceptedAt).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        ${acceptanceDetails.signatureData ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #374151;">Digital Signature:</h3>
            <div style="border: 1px solid #d1d5db; padding: 20px; background-color: #f9fafb; text-align: center;">
              <img src="${acceptanceDetails.signatureData}" alt="Digital Signature" style="max-width: 300px; max-height: 150px; border: 1px solid #e5e7eb;" />
            </div>
          </div>
        ` : ''}
        
        ${(acceptanceDetails.ipAddress || acceptanceDetails.userAgent) ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #374151;">Technical Authentication Details:</h3>
            <div style="font-size: 12px; color: #6b7280;">
              ${acceptanceDetails.ipAddress ? `<p style="margin: 4px 0;">IP Address: ${acceptanceDetails.ipAddress}</p>` : ''}
              ${acceptanceDetails.userAgent ? `<p style="margin: 4px 0;">Browser: ${acceptanceDetails.userAgent.length > 80 ? acceptanceDetails.userAgent.substring(0, 80) + '...' : acceptanceDetails.userAgent}</p>` : ''}
            </div>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #3b82f6;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #374151;">Legal Notice:</h3>
          <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5;">
            This digital acceptance is legally binding and constitutes an agreement to the terms and conditions outlined in the above quote. 
            The digital signature and associated metadata provide authentication of the acceptance.
          </p>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Quote ${quote?.quote_number || quote?.id}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .logo { max-width: 200px; max-height: 80px; }
            .company-info { text-align: right; }
            .quote-details { background: #f8f9fa; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
            .client-info { margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f8f9fa; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f8f9fa; }
            .terms { margin-top: 30px; }
            .signature-section { margin-top: 40px; page-break-inside: avoid; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" class="logo">` : ''}
            </div>
            <div class="company-info">
                <h1>${companyName}</h1>
            </div>
        </div>

        <div class="quote-details">
            <h2>Quote #${quote?.quote_number || quote?.id}</h2>
            <p><strong>Date:</strong> ${new Date(quote?.date || Date.now()).toLocaleDateString()}</p>
            <p><strong>Account Manager:</strong> ${accountManagerName}</p>
            ${quote?.expires_at ? `<p><strong>Expires:</strong> ${new Date(quote.expires_at).toLocaleDateString()}</p>` : ''}
        </div>

        ${contactSection}

        <div class="items-section">
            <h3>Quote Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Type</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${quoteItemsHtml}
                </tbody>
                <tfoot>
                    ${mrcTotal > 0 ? `
                    <tr>
                        <td colspan="4" style="text-align: right; font-weight: bold;">MRC Subtotal:</td>
                        <td style="font-weight: bold;">$${mrcTotal.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${nrcTotal > 0 ? `
                    <tr>
                        <td colspan="4" style="text-align: right; font-weight: bold;">NRC Subtotal:</td>
                        <td style="font-weight: bold;">$${nrcTotal.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td colspan="4" style="text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                        <td style="font-weight: bold; font-size: 16px;">$${(mrcTotal + nrcTotal).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        ${templateContent ? `
        <div class="terms">
            <h3>Terms and Conditions</h3>
            ${processedTemplateContent}
        </div>
        ` : ''}

        ${digitalSignatureSection}
    </body>
    </html>
  `;
};
