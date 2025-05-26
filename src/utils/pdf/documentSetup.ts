
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const setupDocument = async (context: PDFGenerationContext): Promise<{ doc: jsPDF; logoYOffset: number }> => {
  const doc = new jsPDF();
  let logoYOffset = 0;
  
  // Add the large "CALIFORNIA | TELECOM" header at the top
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 139); // Dark blue color
  doc.text('CALIFORNIA | TELECOM', 20, 25);
  
  // Document type "Agreement" in top right - lighter gray color
  doc.setFontSize(24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Agreement', 160, 25);
  
  return { doc, logoYOffset };
};

export const addAgreementDetailsBox = (doc: jsPDF, context: PDFGenerationContext): void => {
  const boxX = 125;
  const boxY = 35;
  const boxWidth = 70;
  const boxHeight = 50;
  
  // Gray background box
  doc.setFillColor(230, 230, 230);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  // Box content with proper spacing
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  // Left column labels
  doc.text('Agreement', boxX + 4, boxY + 10);
  doc.text('Date:', boxX + 4, boxY + 20);
  doc.text('Expires', boxX + 4, boxY + 30);
  doc.text('Account', boxX + 4, boxY + 40);
  doc.text('Manager', boxX + 4, boxY + 48);
  
  // Right column values - right aligned
  doc.setFont('helvetica', 'normal');
  const quoteNumber = context.quote.quoteNumber || `${context.quote.id.slice(0, 4)} v2`;
  const dateText = new Date(context.quote.date).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
  const expiresText = context.quote.expiresAt ? 
    new Date(context.quote.expiresAt).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }) : 'N/A';
  const accountManager = context.salespersonName || 'N/A';
  
  // Right align the values
  const numberWidth = doc.getTextWidth(quoteNumber);
  const dateWidth = doc.getTextWidth(dateText);
  const expiresWidth = doc.getTextWidth(expiresText);
  const managerWidth = doc.getTextWidth(accountManager);
  
  doc.text(quoteNumber, boxX + boxWidth - 4 - numberWidth, boxY + 10);
  doc.text(dateText, boxX + boxWidth - 4 - dateWidth, boxY + 20);
  doc.text(expiresText, boxX + boxWidth - 4 - expiresWidth, boxY + 30);
  doc.text(accountManager, boxX + boxWidth - 4 - managerWidth, boxY + 44);
};

export const addStatusIndicator = (doc: jsPDF, context: PDFGenerationContext): void => {
  const buttonX = 125;
  const buttonY = 90;
  const buttonWidth = 70;
  const buttonHeight = 15;
  
  if (context.isApproved) {
    console.log('PDF Generation - Adding APPROVED status to PDF');
    doc.setFillColor(76, 175, 80);
    doc.rect(buttonX, buttonY, buttonWidth, buttonHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    
    // Calculate text width for perfect centering
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
    
    // Calculate text width for perfect centering
    const buttonText = 'ACCEPT AGREEMENT';
    const textWidth = doc.getTextWidth(buttonText);
    const centeredX = buttonX + (buttonWidth - textWidth) / 2;
    
    doc.text(buttonText, centeredX, buttonY + 10);
    
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: acceptanceUrl });
  }
};
