
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
    return currentY;
  }

  const acceptance = context.acceptanceDetails;

  // Add a new page for acceptance evidence
  doc.addPage();
  currentY = 30;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Acceptance Evidence', 20, currentY);
  currentY += 20;

  // Reset font
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Acceptance information
  doc.text('This document serves as evidence of digital acceptance of the above quote.', 20, currentY);
  currentY += 10;

  // Acceptance details
  doc.setFont('helvetica', 'bold');
  doc.text('Accepted by:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptance.clientName, 60, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptance.clientEmail || 'Not provided', 60, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  const acceptedDate = new Date(acceptance.acceptedAt);
  doc.text(acceptedDate.toLocaleString(), 60, currentY);
  currentY += 8;

  // Technical details (if available)
  if (acceptance.ipAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('IP Address:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(acceptance.ipAddress, 60, currentY);
    currentY += 8;
  }

  if (acceptance.userAgent) {
    doc.setFont('helvetica', 'bold');
    doc.text('Browser:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    // Truncate user agent if too long
    const userAgent = acceptance.userAgent.length > 80 ? 
      acceptance.userAgent.substring(0, 80) + '...' : 
      acceptance.userAgent;
    doc.text(userAgent, 60, currentY);
    currentY += 8;
  }

  currentY += 10;

  // Digital signature
  if (acceptance.signatureData) {
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signature:', 20, currentY);
    currentY += 10;

    try {
      // Add signature image
      const signatureImg = new Image();
      signatureImg.src = acceptance.signatureData;
      
      // Wait for image to load before adding to PDF
      signatureImg.onload = () => {
        doc.addImage(signatureImg, 'PNG', 20, currentY, 100, 40);
      };
      
      currentY += 50;
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      doc.setFont('helvetica', 'italic');
      doc.text('Signature image could not be displayed', 20, currentY);
      currentY += 10;
    }
  }

  // Legal notice
  currentY += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Legal Notice:', 20, currentY);
  currentY += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const legalText = 'This digital acceptance is legally binding and constitutes an agreement to the terms and conditions outlined in the above quote. The digital signature and associated metadata provide authentication of the acceptance.';
  const legalLines = doc.splitTextToSize(legalText, 170);
  doc.text(legalLines, 20, currentY);

  return currentY;
};
