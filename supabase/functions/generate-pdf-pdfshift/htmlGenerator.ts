
import { generateContactSection } from './sections/contactSection.ts';
import { generateItemsSection } from './sections/itemsSection.ts';
import { generateTemplateSection } from './sections/templateSection.ts';

export const generateHTML = (
  quote: any,
  clientInfo: any,
  accountManagerName: string,
  logoUrl?: string,
  companyName?: string,
  templateContent?: string,
  primaryContact?: any
) => {
  console.log('PDFShift Function - Final account manager name in HTML generation:', accountManagerName);
  
  const contact = generateContactSection(primaryContact, clientInfo);
  const { mrcItems, nrcItems, totalMRC, totalNRC } = generateItemsSection(quote.quoteItems);
  const processedTemplateContent = generateTemplateSection(templateContent || '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quote ${quote.quoteNumber || quote.id.slice(0, 8)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; }
        .logo { max-height: 80px; max-width: 200px; }
        .company-info { text-align: right; }
        .quote-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .client-info { margin-bottom: 20px; }
        .contact-section { background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .items-table th { background-color: #f2f2f2; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f8f9fa; }
        .terms-section { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .signature-section { margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h1, h2, h3 { color: #333; }
        .quote-number { font-size: 24px; font-weight: bold; color: #2563eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" class="logo">` : ''}
        </div>
        <div class="company-info">
          <h1>${companyName || 'Company Name'}</h1>
        </div>
      </div>

      <div class="quote-details">
        <h2>Quote Details</h2>
        <div class="quote-number">Quote #${quote.quoteNumber || quote.id.slice(0, 8)}</div>
        <p><strong>Date:</strong> ${formatDate(quote.date)}</p>
        <p><strong>Description:</strong> ${quote.description || 'Service Agreement'}</p>
        <p><strong>Account Manager:</strong> ${accountManagerName}</p>
      </div>

      <div class="client-info">
        <h2>Client Information</h2>
        <div class="contact-section">
          <p><strong>Company:</strong> ${clientInfo?.company_name || 'N/A'}</p>
          ${contact.name ? `<p><strong>Contact:</strong> ${contact.name}</p>` : ''}
          ${contact.title ? `<p><strong>Title:</strong> ${contact.title}</p>` : ''}
          ${contact.email ? `<p><strong>Email:</strong> ${contact.email}</p>` : ''}
          ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
          ${clientInfo?.address ? `<p><strong>Address:</strong> ${clientInfo.address}</p>` : ''}
        </div>
      </div>

      ${mrcItems.length > 0 ? `
      <div>
        <h2>Monthly Recurring Charges (MRC)</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${mrcItems.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4"><strong>Total Monthly Recurring</strong></td>
              <td><strong>${formatCurrency(totalMRC)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      ${nrcItems.length > 0 ? `
      <div>
        <h2>Non-Recurring Charges (NRC)</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${nrcItems.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4"><strong>Total Non-Recurring</strong></td>
              <td><strong>${formatCurrency(totalNRC)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      ${processedTemplateContent ? `
      <div class="terms-section">
        <h2>Terms and Conditions</h2>
        ${processedTemplateContent}
      </div>
      ` : ''}

      <div class="signature-section">
        <h2>Acceptance</h2>
        <p>By signing below, you agree to the terms and conditions outlined in this quote.</p>
        <br><br>
        <div style="display: flex; justify-content: space-between;">
          <div>
            <p>_________________________</p>
            <p>Customer Signature</p>
          </div>
          <div>
            <p>_________________________</p>
            <p>Date</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
