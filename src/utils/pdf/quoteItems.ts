
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
    
    // Process description to extract images and text from HTML
    const descriptionContent = await processHtmlDescriptionContent(item.description || item.item?.description || '');
    let rowHeight = Math.max(10, descriptionContent.minHeight);
    
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
    
    // Add description text and embedded images
    await addDescriptionContent(doc, descriptionContent, colX.description + 4, yPos + 10);
    
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

// Process HTML description content to extract text and images
const processHtmlDescriptionContent = async (description: string): Promise<{
  text: string;
  images: Array<{ url: string; alt: string; data?: string }>;
  minHeight: number;
}> => {
  if (!description) return { text: '', images: [], minHeight: 10 };
  
  console.log('[PDF] Processing HTML description:', description.substring(0, 200));
  
  // Extract images using regex for HTML img tags
  const imageRegex = /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/g;
  const images: Array<{ url: string; alt: string; data?: string }> = [];
  let match;
  
  while ((match = imageRegex.exec(description)) !== null) {
    const url = match[1] || '';
    const alt = match[2] || 'Image';
    
    console.log('[PDF] Found image in description:', { url: url.substring(0, 100), alt });
    
    try {
      const imageData = await loadImageForPDF(url);
      if (imageData) {
        images.push({ url, alt, data: imageData });
        console.log('[PDF] Successfully loaded image data for:', alt);
      } else {
        console.log('[PDF] Failed to load image data for:', alt);
        images.push({ url, alt });
      }
    } catch (error) {
      console.error('[PDF] Error loading embedded image:', error);
      images.push({ url, alt });
    }
  }
  
  // Extract plain text (remove HTML tags)
  const plainText = description
    .replace(/<img[^>]*>/g, '') // Remove img tags
    .replace(/<strong>(.*?)<\/strong>/g, '$1') // Remove strong tags but keep content
    .replace(/<em>(.*?)<\/em>/g, '$1') // Remove em tags but keep content
    .replace(/<u>(.*?)<\/u>/g, '$1') // Remove u tags but keep content
    .replace(/<br\s*\/?>/g, ' ') // Replace br tags with spaces
    .replace(/<\/p><p>/g, '\n') // Convert p tags to line breaks
    .replace(/<p>/g, '') // Remove opening p tags
    .replace(/<\/p>/g, '') // Remove closing p tags
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Calculate minimum height needed (text + images)
  const textLines = Math.ceil(plainText.length / 40); // Approximate line count
  const imageHeight = images.filter(img => img.data).length > 0 ? 15 : 0; // Height per image row
  const minHeight = Math.max(10, (textLines * 4) + imageHeight + 5);
  
  console.log('[PDF] Description processing complete:', { 
    textLength: plainText.length, 
    imageCount: images.length, 
    loadedImages: images.filter(img => img.data).length,
    minHeight 
  });
  
  return { text: plainText, images, minHeight };
};

// Add description content (text and images) to PDF
const addDescriptionContent = async (
  doc: jsPDF, 
  content: { text: string; images: Array<{ url: string; alt: string; data?: string }> }, 
  startX: number, 
  startY: number
): Promise<void> => {
  let currentY = startY;
  
  // Add description text
  if (content.text) {
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    const textLines = doc.splitTextToSize(content.text, 80);
    doc.text(textLines, startX, currentY);
    currentY += Array.isArray(textLines) ? textLines.length * 3 : 3;
  }
  
  // Add embedded images
  if (content.images.length > 0) {
    let imageX = startX;
    
    for (const image of content.images) {
      if (image.data) {
        try {
          const imageWidth = 12;
          const imageHeight = 12;
          
          console.log('[PDF] Adding image to PDF at position:', { x: imageX, y: currentY, width: imageWidth, height: imageHeight });
          
          // Try different image formats
          let format = 'JPEG';
          if (image.data.includes('data:image/png')) {
            format = 'PNG';
          } else if (image.data.includes('data:image/gif')) {
            format = 'GIF';
          }
          
          doc.addImage(image.data, format, imageX, currentY, imageWidth, imageHeight);
          console.log('[PDF] Successfully added image to PDF:', image.alt);
          
          imageX += imageWidth + 2; // Add spacing between images
          
          // If images would exceed row width, move to next row
          if (imageX > startX + 70) {
            currentY += imageHeight + 2;
            imageX = startX;
          }
        } catch (error) {
          console.error('[PDF] Error adding embedded image to PDF:', error);
          // Add a placeholder text instead of the image
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          doc.text(`[Image: ${image.alt}]`, imageX, currentY);
          imageX += 20;
        }
      }
    }
  }
};

// Helper function to load image for PDF with better error handling and timeout
const loadImageForPDF = (imageUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    console.log('[PDF] Loading image for PDF:', imageUrl.substring(0, 100));
    
    // Set a timeout for image loading
    const timeout = setTimeout(() => {
      console.log('[PDF] Image loading timeout for:', imageUrl.substring(0, 50));
      resolve(null);
    }, 10000); // 10 second timeout
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        console.log('[PDF] Image loaded successfully, converting to canvas:', {
          width: img.width,
          height: img.height,
          src: imageUrl.substring(0, 50)
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.log('[PDF] Failed to get canvas context');
          resolve(null);
          return;
        }
        
        // Set reasonable canvas size
        const maxSize = 500; // Maximum dimension
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        console.log('[PDF] Image converted to data URL successfully, size:', dataURL.length);
        resolve(dataURL);
      } catch (error) {
        clearTimeout(timeout);
        console.error('[PDF] Error converting image to data URL:', error);
        resolve(null);
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error('[PDF] Error loading image:', error, imageUrl.substring(0, 50));
      resolve(null);
    };
    
    // Handle different URL types
    if (imageUrl.startsWith('data:')) {
      // Data URL - can be used directly
      img.src = imageUrl;
    } else if (imageUrl.startsWith('http')) {
      // External URL - may have CORS issues
      img.src = imageUrl;
    } else {
      // Relative URL - make it absolute
      img.src = new URL(imageUrl, window.location.origin).href;
    }
  });
};
