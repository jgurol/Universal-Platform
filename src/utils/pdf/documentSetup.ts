import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const setupDocument = async (context: PDFGenerationContext): Promise<{ doc: jsPDF; logoYOffset: number }> => {
  const doc = new jsPDF();
  let logoYOffset = 0;
  
  // Load and add company logo if available
  if (context.businessSettings.logoUrl) {
    try {
      const img = new Image();
      img.onload = function() {
        const maxWidth = 60;
        const maxHeight = 30;
        const aspectRatio = img.width / img.height;
        
        let logoWidth = maxWidth;
        let logoHeight = maxWidth / aspectRatio;
        
        if (logoHeight > maxHeight) {
          logoHeight = maxHeight;
          logoWidth = maxHeight * aspectRatio;
        }
        
        doc.addImage(context.businessSettings.logoUrl, 'JPEG', 20, 15, logoWidth, logoHeight);
        logoYOffset = logoHeight;
      };
      img.src = context.businessSettings.logoUrl;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      logoYOffset = 30;
    } catch (error) {
      console.error('Error loading logo:', error);
      logoYOffset = 0;
    }
  }
  
  // Document type in top right
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Agreement', 170, 25);
  
  return { doc, logoYOffset };
};

export const addAgreementDetailsBox = (doc: jsPDF, context: PDFGenerationContext): void => {
  const boxX = 135;
  const boxY = 40;
  const boxWidth = 60;
  const boxHeight = 52;
  
  // Gray background
  doc.setFillColor(230, 230, 230);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  // Labels (left aligned)
  doc.text('Agreement', boxX + 3, boxY + 8);
  doc.text('Date:', boxX + 3, boxY + 18);
  doc.text('Expires', boxX + 3, boxY + 28);
  doc.text('Account', boxX + 3, boxY + 38);
  doc.text('Manager', boxX + 3, boxY + 45);
  
  // Values (right aligned)
  doc.setFont('helvetica', 'normal');
  const quoteNum = context.quote.quoteNumber || `${context.quote.id.slice(0, 4)} v2`;
  const quoteNumWidth = doc.getTextWidth(quoteNum);
  doc.text(quoteNum, boxX + boxWidth - 3 - quoteNumWidth, boxY + 8);
  
  const dateStr = new Date(context.quote.date).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
  const dateWidth = doc.getTextWidth(dateStr);
  doc.text(dateStr, boxX + boxWidth - 3 - dateWidth, boxY + 18);
  
  const expiresStr = context.quote.expiresAt ? 
    new Date(context.quote.expiresAt).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }) : 'N/A';
  const expiresWidth = doc.getTextWidth(expiresStr);
  doc.text(expiresStr, boxX + boxWidth - 3 - expiresWidth, boxY + 28);
  
  const managerName = context.salespersonName || 'N/A';
  const managerWidth = doc.getTextWidth(managerName);
  doc.text(managerName, boxX + boxWidth - 3 - managerWidth, boxY + 45);
};

export const addStatusIndicator = (doc: jsPDF, context: PDFGenerationContext): void => {
  const buttonX = 135;
  const buttonY = 100;
  const buttonWidth = 60;
  const buttonHeight = 12;
  
  if (context.isApproved) {
    console.log('PDF Generation - Adding APPROVED status to PDF');
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    const approvedText = 'APPROVED';
    const textWidth = doc.getTextWidth(approvedText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(approvedText, centeredX, buttonY + 8);
  } else {
    console.log('PDF Generation - Adding ACCEPT AGREEMENT button to PDF');
    const acceptanceUrl = `${window.location.origin}/accept-quote/${context.quote.id}`;
    
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    const buttonText = 'ACCEPT AGREEMENT';
    const textWidth = doc.getTextWidth(buttonText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(buttonText, centeredX, buttonY + 8);
    
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: acceptanceUrl });
  }
};
