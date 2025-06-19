
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
    
    // Process description to extract content with proper order preservation
    const descriptionContent = await processDescriptionWithOrderPreservation(item.description || item.item?.description || '');
    
    // Calculate proper row height based on content
    let rowHeight = 12; // Base height increased
    
    // Calculate height needed for all content
    if (descriptionContent.length > 0) {
      let contentHeight = 0;
      
      for (const contentItem of descriptionContent) {
        if (contentItem.type === 'text') {
          const lines = Math.ceil(contentItem.content.length / 35);
          contentHeight += Math.max(1, lines) * 3;
        } else if (contentItem.type === 'image' && contentItem.data) {
          contentHeight += 20; // Fixed height for images
        }
      }
      
      rowHeight = Math.max(rowHeight, contentHeight + 15);
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
    
    // Add description content in the correct order
    const contentStartY = yPos + 10;
    await addDescriptionContentInOrder(doc, descriptionContent, colX.description + 4, contentStartY);
    
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

// New function to process HTML/markdown content while preserving exact order
const processDescriptionWithOrderPreservation = async (description: string): Promise<Array<{
  type: 'text' | 'image';
  content: string;
  data?: string;
  dimensions?: { width: number; height: number };
}>> => {
  if (!description) return [];
  
  console.log('[PDF] Processing description with order preservation:', description.substring(0, 200));
  
  const contentItems: Array<{
    type: 'text' | 'image';
    content: string;
    data?: string;
    dimensions?: { width: number; height: number };
  }> = [];
  
  // Create a temporary DOM structure to parse HTML properly
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = description;
  
  // Process nodes in document order to maintain sequence
  const processNode = async (node: Node): Promise<void> => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        contentItems.push({
          type: 'text',
          content: text
        });
        console.log('[PDF] Found text in order:', text.substring(0, 50));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      if (element.tagName === 'IMG') {
        const url = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || 'Image';
        
        console.log('[PDF] Found image in order:', { url: url.substring(0, 100), alt });
        
        try {
          const imageResult = await loadImageForPDF(url);
          if (imageResult) {
            contentItems.push({
              type: 'image',
              content: alt,
              data: imageResult.data,
              dimensions: imageResult.dimensions
            });
            console.log('[PDF] Successfully loaded image data for:', alt);
          } else {
            contentItems.push({
              type: 'image',
              content: alt
            });
          }
        } catch (error) {
          console.error('[PDF] Error loading embedded image:', error);
          contentItems.push({
            type: 'image',
            content: alt
          });
        }
      } else {
        // Process child nodes for other elements (p, strong, em, etc.)
        for (const child of Array.from(element.childNodes)) {
          await processNode(child);
        }
      }
    }
  };
  
  // Process all nodes maintaining order
  for (const child of Array.from(tempDiv.childNodes)) {
    await processNode(child);
  }
  
  // Clean up text content
  const cleanedItems = contentItems.map(item => {
    if (item.type === 'text') {
      const cleanedText = item.content
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      return { ...item, content: cleanedText };
    }
    return item;
  }).filter(item => item.content.length > 0);
  
  console.log('[PDF] Description processing complete with order preservation:', { 
    totalItems: cleanedItems.length,
    sequence: cleanedItems.map((item, i) => `${i + 1}: ${item.type} - ${item.content.substring(0, 30)}`)
  });
  
  return cleanedItems;
};

// Add description content maintaining exact order from ReactQuill
const addDescriptionContentInOrder = async (
  doc: jsPDF, 
  contentItems: Array<{
    type: 'text' | 'image';
    content: string;
    data?: string;
    dimensions?: { width: number; height: number };
  }>, 
  startX: number, 
  startY: number
): Promise<void> => {
  let currentY = startY;
  const lineHeight = 3;
  const contentWidth = 120;
  
  console.log('[PDF] Adding content in order, total items:', contentItems.length);
  
  // Process items in their original order
  for (let i = 0; i < contentItems.length; i++) {
    const item = contentItems[i];
    console.log(`[PDF] Processing item ${i + 1}: ${item.type} - ${item.content.substring(0, 30)}`);
    
    if (item.type === 'text') {
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      
      const textLines = doc.splitTextToSize(item.content, contentWidth);
      
      if (Array.isArray(textLines)) {
        textLines.forEach((line) => {
          doc.text(line, startX, currentY);
          currentY += lineHeight;
        });
      } else {
        doc.text(textLines, startX, currentY);
        currentY += lineHeight;
      }
      
      // Small spacing after text
      currentY += 1;
      
    } else if (item.type === 'image' && item.data && item.dimensions) {
      try {
        const maxImageWidth = 20;
        const maxImageHeight = 18;
        
        // Calculate proper dimensions maintaining aspect ratio
        let { width, height } = item.dimensions;
        const aspectRatio = width / height;
        
        if (width > maxImageWidth || height > maxImageHeight) {
          if (aspectRatio > 1) {
            width = maxImageWidth;
            height = maxImageWidth / aspectRatio;
          } else {
            height = maxImageHeight;
            width = maxImageHeight * aspectRatio;
          }
        }
        
        console.log(`[PDF] Adding image ${i + 1} at position:`, { 
          x: startX, 
          y: currentY, 
          width, 
          height,
          content: item.content
        });
        
        // Determine image format
        let format = 'JPEG';
        if (item.data.includes('data:image/png')) {
          format = 'PNG';
        } else if (item.data.includes('data:image/gif')) {
          format = 'GIF';
        }
        
        doc.addImage(item.data, format, startX, currentY, width, height);
        console.log(`[PDF] Successfully added image ${i + 1}:`, item.content);
        
        // Move Y position after image
        currentY += height + 3; // Add spacing after image
        
      } catch (error) {
        console.error(`[PDF] Error adding image ${i + 1} to PDF:`, error);
        // Add a placeholder text instead
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text(`[Image: ${item.content}]`, startX, currentY);
        currentY += lineHeight;
      }
    }
  }
  
  console.log('[PDF] Finished adding content in order, final Y:', currentY);
};

// Helper function to load image for PDF with proper dimension tracking
const loadImageForPDF = (imageUrl: string): Promise<{ data: string; dimensions: { width: number; height: number } } | null> => {
  return new Promise((resolve) => {
    console.log('[PDF] Loading image for PDF:', imageUrl.substring(0, 100));
    
    // Set a timeout for image loading
    const timeout = setTimeout(() => {
      console.log('[PDF] Image loading timeout for:', imageUrl.substring(0, 50));
      resolve(null);
    }, 8000); // 8 second timeout
    
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
        
        // Store original dimensions for aspect ratio calculation
        const originalDimensions = { width: img.width, height: img.height };
        
        // Set reasonable canvas size for processing (maintain aspect ratio)
        const maxSize = 400; // Reduced size for better performance
        let { width, height } = originalDimensions;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.7); // Reduced quality for better performance
        console.log('[PDF] Image converted to data URL successfully, size:', dataURL.length, 'dimensions:', { width, height });
        
        resolve({ 
          data: dataURL, 
          dimensions: originalDimensions // Return original dimensions for aspect ratio calculation
        });
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
