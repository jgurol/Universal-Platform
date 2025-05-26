
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
        const maxWidth = 80;
        const maxHeight = 25;
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
      logoYOffset = 25;
    } catch (error) {
      console.error('Error loading logo:', error);
      logoYOffset = 0;
    }
  }
  
  // Document type in top right - larger and positioned like the reference
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Agreement', 170, 25);
  
  return { doc, logoYOffset };
};

export const addAgreementDetailsBox = (doc: jsPDF, context: PDFGenerationContext): void => {
  const boxX = 130;
  const boxY = 35;
  const boxWidth = 65;
  const boxHeight = 50;
  
  // Gray background box
  doc.setFillColor(220, 220, 220);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  
  // Content styling to match reference
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  // Agreement number (top right of box)
  const agreementNum = context.quote.quoteNumber || `${context.quote.id.slice(0, 4)} v2`;
  doc.text(agreementNum, boxX + boxWidth - 5, boxY + 8, { align: 'right' });
  
  // Labels and values
  doc.text('Agreement', boxX + 3, boxY + 8);
  doc.text('Date:', boxX + 3, boxY + 18);
  doc.text('Expires', boxX + 3, boxY + 28);
  doc.text('Account', boxX + 3, boxY + 38);
  doc.text('Manager', boxX + 3, boxY + 45);
  
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(context.quote.date).toLocaleDateString('en-US'), boxX + 45, boxY + 18);
  doc.text(context.quote.expiresAt ? new Date(context.quote.expiresAt).toLocaleDateString('en-US') : 'N/A', boxX + 45, boxY + 28);
  doc.text(context.salespersonName || 'N/A', boxX + 45, boxY + 42);
};

export const addStatusIndicator = (doc: jsPDF, context: PDFGenerationContext): void => {
  const buttonX = 140;
  const buttonY = 270;
  const buttonWidth = 55;
  const buttonHeight = 15;
  
  if (context.isApproved) {
    console.log('PDF Generation - Adding APPROVED status to PDF');
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    
    const approvedText = 'APPROVED';
    const textWidth = doc.getTextWidth(approvedText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(approvedText, centeredX, buttonY + 10);
  } else {
    console.log('PDF Generation - Adding ACCEPT AGREEMENT button to PDF');
    const acceptanceUrl = `${window.location.origin}/accept-quote/${context.quote.id}`;
    
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    
    const buttonText = 'ACCEPT AGREEMENT';
    const textWidth = doc.getTextWidth(buttonText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(buttonText, centeredX, buttonY + 10);
    
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: acceptanceUrl });
  }
};
