
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
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Agreement', 160, 18);
  
  return { doc, logoYOffset };
};

export const addAgreementDetailsBox = (doc: jsPDF, context: PDFGenerationContext): void => {
  const boxX = 125;
  const boxY = 12;
  const boxWidth = 70;
  const boxHeight = 40;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Agreement #:', boxX + 4, boxY + 8);
  doc.text('Date:', boxX + 4, boxY + 16);
  doc.text('Expires:', boxX + 4, boxY + 24);
  doc.text('Account Manager:', boxX + 4, boxY + 32);
  
  doc.setFont('helvetica', 'normal');
  doc.text(context.quote.quoteNumber || `Q-${context.quote.id.slice(0, 8)}`, boxX + 30, boxY + 8);
  doc.text(new Date(context.quote.date).toLocaleDateString(), boxX + 18, boxY + 16);
  doc.text(context.quote.expiresAt ? new Date(context.quote.expiresAt).toLocaleDateString() : 'N/A', boxX + 22, boxY + 24);
  doc.text(context.salespersonName || 'N/A', boxX + 4, boxY + 38);
};

export const addStatusIndicator = (doc: jsPDF, context: PDFGenerationContext): void => {
  const buttonX = 110;
  const buttonY = 120;
  const buttonWidth = 85;
  const buttonHeight = 12;
  
  if (context.isApproved) {
    console.log('PDF Generation - Adding APPROVED status to PDF');
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Calculate text width for perfect centering
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
    
    // Calculate text width for perfect centering
    const buttonText = 'ACCEPT AGREEMENT';
    const textWidth = doc.getTextWidth(buttonText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(buttonText, centeredX, buttonY + 8);
    
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: acceptanceUrl });
  }
};
