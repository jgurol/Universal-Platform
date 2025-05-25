import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { PDFGenerationContext, AcceptanceDetails } from './types';

export const fetchAcceptanceDetails = async (quoteId: string): Promise<AcceptanceDetails | null> => {
  console.log('PDF Generation - Quote is approved, fetching acceptance details...');
  try {
    // Try multiple queries to find acceptance data
    const { data: acceptance, error } = await supabase
      .from('quote_acceptances')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    console.log('PDF Generation - Acceptance query result:', { acceptance, error });
    
    if (!error && acceptance) {
      console.log('PDF Generation - Found acceptance details:', {
        client_name: acceptance.client_name,
        client_email: acceptance.client_email,
        accepted_at: acceptance.accepted_at,
        ip_address: acceptance.ip_address ? String(acceptance.ip_address) : null,
        user_agent: acceptance.user_agent,
        has_signature: !!acceptance.signature_data
      });
      
      // Properly type cast the acceptance data
      const acceptanceDetails: AcceptanceDetails = {
        client_name: acceptance.client_name,
        client_email: acceptance.client_email,
        accepted_at: acceptance.accepted_at,
        ip_address: acceptance.ip_address ? String(acceptance.ip_address) : null,
        user_agent: acceptance.user_agent,
        signature_data: acceptance.signature_data
      };
      
      return acceptanceDetails;
    } else {
      console.log('PDF Generation - No acceptance details in quote_acceptances table');
      
      // Also check if the quote itself has acceptance data
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('accepted_at, accepted_by, acceptance_status')
        .eq('id', quoteId)
        .single();
        
      console.log('PDF Generation - Quote acceptance data from quotes table:', { quoteData, quoteError });
      return null;
    }
  } catch (error) {
    console.error('PDF Generation - Error fetching acceptance details:', error);
    return null;
  }
};

export const addDigitalAcceptanceEvidence = (doc: jsPDF, context: PDFGenerationContext, startY: number): number => {
  if (!context.isApproved) return startY;
  
  console.log('PDF Generation - Adding comprehensive digital acceptance evidence section');
  console.log('PDF Generation - Acceptance details available:', !!context.acceptanceDetails);
  
  let yPos = startY;
  const remainingSpace = 297 - 20 - yPos;
  
  if (remainingSpace < 140) {
    doc.addPage();
    yPos = 30;
    console.log('PDF Generation - Added new page for acceptance evidence');
  } else {
    yPos += 20;
  }
  
  // Add prominent separator
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(20, yPos, 195, yPos);
  yPos += 15;
  
  // Header with background
  doc.setFillColor(240, 248, 255);
  doc.rect(20, yPos - 8, 175, 20, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, yPos - 8, 175, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 50, 100);
  doc.text('DIGITAL ACCEPTANCE EVIDENCE', 25, yPos + 3);
  yPos += 25;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // ALWAYS SHOW ACCEPTANCE DETAILS WHEN APPROVED
  if (context.acceptanceDetails) {
    yPos = addDetailedAcceptanceInfo(doc, context.acceptanceDetails, yPos);
  } else {
    yPos = addBasicAcceptanceInfo(doc, context, yPos);
  }
  
  // Legal notice with better formatting
  yPos = addLegalNotice(doc, yPos);
  
  console.log('PDF Generation - Digital acceptance evidence section completed');
  return yPos;
};

const addDetailedAcceptanceInfo = (doc: jsPDF, acceptanceDetails: AcceptanceDetails, yPos: number): number => {
  console.log('PDF Generation - Displaying COMPLETE acceptance details from database');
  
  // Client information with better spacing
  doc.setFont('helvetica', 'bold');
  doc.text('Accepted by:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptanceDetails.client_name || 'Unknown', 85, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Email Address:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptanceDetails.client_email || 'Unknown', 85, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Acceptance Date:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  const acceptedDate = acceptanceDetails.accepted_at ? 
    new Date(acceptanceDetails.accepted_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }) : 'Unknown';
  doc.text(acceptedDate, 85, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('IP Address:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptanceDetails.ip_address || 'Not recorded', 85, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Browser/Device:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  const userAgent = acceptanceDetails.user_agent || 'Not recorded';
  const splitUserAgent = doc.splitTextToSize(userAgent, 110);
  doc.text(splitUserAgent, 85, yPos);
  yPos += Array.isArray(splitUserAgent) ? splitUserAgent.length * 4 + 6 : 10;
  
  // Digital signature with enhanced display
  if (acceptanceDetails.signature_data) {
    yPos = addDigitalSignature(doc, acceptanceDetails.signature_data, yPos);
  } else {
    yPos = addNoSignatureMessage(doc, yPos);
  }
  
  return yPos;
};

const addBasicAcceptanceInfo = (doc: jsPDF, context: PDFGenerationContext, yPos: number): number => {
  console.log('PDF Generation - No detailed acceptance data found, showing basic approved status');
  
  // Show basic status when no detailed acceptance data is available
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Agreement has been digitally accepted by client', 85, yPos);
  yPos += 10;
  
  if ((context.quote as any).accepted_by) {
    doc.setFont('helvetica', 'bold');
    doc.text('Accepted by:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text((context.quote as any).accepted_by, 85, yPos);
    yPos += 10;
  }
  
  if ((context.quote as any).accepted_at) {
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    const acceptedDate = new Date((context.quote as any).accepted_at).toLocaleString();
    doc.text(acceptedDate, 85, yPos);
    yPos += 10;
  }
  
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Detailed acceptance evidence may be available in system records', 25, yPos);
  yPos += 12;
  
  return yPos;
};

const addDigitalSignature = (doc: jsPDF, signatureData: string, yPos: number): number => {
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Signature:', 25, yPos);
  yPos += 8;
  
  try {
    // Add signature with better formatting
    const signatureHeight = 35;
    const signatureWidth = 120;
    
    // Draw signature border with label
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(25, yPos, signatureWidth, signatureHeight);
    
    // Add signature image
    doc.addImage(signatureData, 'PNG', 26, yPos + 1, signatureWidth - 2, signatureHeight - 2);
    
    // Add signature verification text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Legally binding digital signature captured at time of acceptance', 25, yPos + signatureHeight + 5);
    
    yPos += signatureHeight + 10;
    
    console.log('PDF Generation - Digital signature added successfully');
  } catch (error) {
    console.error('PDF Generation - Error adding signature:', error);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('[Digital signature on file - unable to display in PDF]', 25, yPos);
    yPos += 8;
  }
  
  return yPos;
};

const addNoSignatureMessage = (doc: jsPDF, yPos: number): number => {
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Signature:', 25, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('[No digital signature recorded]', 25, yPos);
  yPos += 10;
  
  return yPos;
};

const addLegalNotice = (doc: jsPDF, yPos: number): number => {
  yPos += 5;
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, 175, 20, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, yPos, 175, 20);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text('This document contains legally binding digital acceptance evidence.', 25, yPos + 7);
  doc.text('All acceptance data is stored securely and can be verified upon request.', 25, yPos + 13);
  
  return yPos + 20;
};
