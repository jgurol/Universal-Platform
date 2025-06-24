
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { PDFGenerationContext, AcceptanceDetails } from './types';

export const fetchAcceptanceDetails = async (quoteId: string): Promise<AcceptanceDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('quote_acceptances')
      .select('*')
      .eq('quote_id', quoteId)
      .single();

    if (error) {
      console.error('Error fetching acceptance details:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      clientName: data.client_name,
      clientEmail: data.client_email,
      signatureData: data.signature_data,
      acceptedAt: data.accepted_at,
      ipAddress: data.ip_address?.toString() || undefined,
      userAgent: data.user_agent || undefined
    };
  } catch (error) {
    console.error('Exception fetching acceptance details:', error);
    return null;
  }
};

export const addDigitalAcceptanceEvidence = (
  doc: jsPDF,
  context: PDFGenerationContext,
  startY: number
): number => {
  let currentY = startY;

  // Only add acceptance evidence if the quote is approved and we have acceptance details
  if (!context.isApproved || !context.acceptanceDetails) {
    console.log('PDF Generation - No acceptance details to add');
    return currentY;
  }

  const acceptance = context.acceptanceDetails;

  // Add some space before the signature section
  currentY += 30;

  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 30;
  }

  console.log('PDF Generation - Adding digital signature evidence at Y:', currentY);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Signature & Acceptance Evidence', 20, currentY);
  currentY += 15;

  // Reset font
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Acceptance information
  doc.text('This document serves as evidence of digital acceptance of the above agreement.', 20, currentY);
  currentY += 15;

  // Acceptance details in a structured format
  doc.setFont('helvetica', 'bold');
  doc.text('Accepted by:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptance.clientName, 80, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptance.clientEmail || 'Not provided', 80, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  const acceptedDate = new Date(acceptance.acceptedAt);
  doc.text(acceptedDate.toLocaleString(), 80, currentY);
  currentY += 15;

  // Digital signature section
  if (acceptance.signatureData) {
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signature:', 20, currentY);
    currentY += 10;

    try {
      // Add signature image directly from base64 data
      console.log('PDF Generation - Adding signature image');
      doc.addImage(acceptance.signatureData, 'PNG', 20, currentY, 120, 48);
      currentY += 55;
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      // Add signature placeholder box
      doc.rect(20, currentY, 120, 48);
      doc.setFont('helvetica', 'italic');
      doc.text('Digital signature captured', 25, currentY + 25);
      currentY += 55;
    }
  }

  // Technical details (if available)
  if (acceptance.ipAddress || acceptance.userAgent) {
    currentY += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Technical Authentication Details:', 20, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    if (acceptance.ipAddress) {
      doc.text(`IP Address: ${acceptance.ipAddress}`, 20, currentY);
      currentY += 6;
    }
    
    if (acceptance.userAgent) {
      // Truncate user agent if too long
      const userAgent = acceptance.userAgent.length > 80 ? 
        acceptance.userAgent.substring(0, 80) + '...' : 
        acceptance.userAgent;
      doc.text(`Browser: ${userAgent}`, 20, currentY);
      currentY += 6;
    }
  }

  // Legal notice
  currentY += 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Legal Notice:', 20, currentY);
  currentY += 8;
  
  doc.setFont('helvetica', 'normal');
  const legalText = 'This digital acceptance is legally binding and constitutes an agreement to the terms and conditions outlined in the above quote. The digital signature and associated metadata provide authentication of the acceptance.';
  const legalLines = doc.splitTextToSize(legalText, 170);
  doc.text(legalLines, 20, currentY);
  currentY += legalLines.length * 5;

  console.log('PDF Generation - Digital signature evidence section completed at Y:', currentY);
  return currentY;
};
