import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const addQuoteItems = async (doc: jsPDF, context: PDFGenerationContext, startY: number): Promise<number> => {
  const { quote, clientInfo } = context;
  let yPos = startY;
  
  // Quote Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const quoteTitle = quote.description || (clientInfo?.company_name ? `${clientInfo.company_name} - Service Agreement` : 'Service Agreement');
  doc.text(quoteTitle, 10, yPos);
  
  // Items Section
  yPos += 12;
  
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    const mrcItems = quote.quoteItems.filter(item => item.charge_type === 'MRC');
    const nrcItems = quote.quoteItems.filter(item => item.charge_type === 'NRC');
    
    const colX = {
      description: 10,
      qty: 140,
      price: 155,
      total: 170
    };
    
    // Monthly Fees Section
    if (mrcItems.length > 0) {
      yPos = await addMRCItems(doc, mrcItems, quote, yPos, colX);
    }
    
    // One-Time Fees
    if (nrcItems.length > 0) {
      yPos = addNRCItems(doc, nrcItems, yPos, colX);
    }
  }
  
  return yPos;
};

const addMRCItems = async (doc: jsPDF, mrcItems: any[], quote: any, yPos: number, colX: any): Promise<number> => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Fees', 10, yPos);
  yPos += 10;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(colX.description, yPos - 6, 190, 8, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(colX.description, yPos - 6, 190, 8);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', colX.description + 2, yPos - 1);
  doc.text('Qty', colX.qty + 2, yPos - 1);
  doc.text('Price', colX.price + 2, yPos - 1);
  doc.text('Total', colX.total + 2, yPos - 1);
  
  yPos += 4;
  
  doc.setFont('helvetica', 'normal');
  
  for (let index = 0; index < mrcItems.length; index++) {
    const item = mrcItems[index];
    const itemName = item.item?.name || item.name || 'Monthly Service';
    
    let addressText = '';
    if (item.address) {
      addressText = `${item.address.street_address}, ${item.address.city}, ${item.address.state} ${item.address.zip_code}`;
    } else {
      addressText = quote.serviceAddress || quote.billingAddress || 'Service location not specified';
    }
    
    if (addressText.length > 40) {
      addressText = addressText.substring(0, 37) + '...';
    }
    
    let rowHeight = 10;
    let imageHeight = 0;
    
    // Check if item has an image
    if (item.image_url) {
      try {
        console.log('[PDF] Adding image for item:', itemName, 'URL:', item.image_url);
        const imageData = await loadImageForPDF(item.image_url);
        if (imageData) {
          imageHeight = 20; // Reserve space for image
          rowHeight = Math.max(rowHeight, imageHeight + 2);
        }
      } catch (error) {
        console.error('[PDF] Error loading image:', error);
      }
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(colX.description, yPos - 3, 190, rowHeight, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(itemName.substring(0, 35), colX.description + 2, yPos);
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Location: ${addressText}`, colX.description + 4, yPos + 5);
    
    // Add image if available
    if (item.image_url && imageHeight > 0) {
      try {
        const imageData = await loadImageForPDF(item.image_url);
        if (imageData) {
          // Position image to the right of the description
          const imageX = colX.description + 90;
          const imageY = yPos - 2;
          const imageWidth = 15;
          const actualImageHeight = 15;
          
          doc.addImage(imageData, 'JPEG', imageX, imageY, imageWidth, actualImageHeight);
          console.log('[PDF] Image added successfully at:', imageX, imageY);
        }
      } catch (error) {
        console.error('[PDF] Error adding image to PDF:', error);
      }
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    const qtyText = item.quantity.toString();
    const priceText = `$${Number(item.unit_price).toFixed(2)}`;
    const totalText = `$${Number(item.total_price).toFixed(2)}`;
    
    const qtyWidth = doc.getTextWidth(qtyText);
    const priceWidth = doc.getTextWidth(priceText);
    const totalWidth = doc.getTextWidth(totalText);
    
    doc.text(qtyText, colX.qty + 12 - qtyWidth, yPos);
    doc.text(priceText, colX.price + 12 - priceWidth, yPos);
    doc.text(totalText, colX.total + 12 - totalWidth, yPos);
    
    yPos += rowHeight;
  }
  
  yPos += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(colX.description, yPos, 200, yPos);
  yPos += 6;
  
  const mrcTotal = mrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  const totalLabelText = 'Total Monthly:';
  const totalAmountText = `$${mrcTotal.toFixed(2)} USD`;
  const totalAmountWidth = doc.getTextWidth(totalAmountText);
  
  doc.text(totalLabelText, colX.price - 30, yPos);
  doc.text(totalAmountText, colX.total + 12 - totalAmountWidth, yPos);
  
  return yPos;
};

const addNRCItems = (doc: jsPDF, nrcItems: any[], yPos: number, colX: any): number => {
  yPos += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  const nrcTotal = nrcItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  const nrcTotalText = `$${nrcTotal.toFixed(2)} USD`;
  const nrcTotalWidth = doc.getTextWidth(nrcTotalText);
  
  doc.text('One-Time Setup Fees:', colX.price - 30, yPos);
  doc.text(nrcTotalText, colX.total + 12 - nrcTotalWidth, yPos);
  
  return yPos;
};

// Helper function to load image for PDF
const loadImageForPDF = (imageUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } catch (error) {
        console.error('[PDF] Error converting image to data URL:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('[PDF] Error loading image:', imageUrl);
      resolve(null);
    };
    
    img.src = imageUrl;
  });
};
