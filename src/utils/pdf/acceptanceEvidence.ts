
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

  // Add some space before the signature section
  currentY += 30;

  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 30;
  }

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
  currentY += 10;

  // Acceptance details in a structured format
  doc.setFont('helvetica', 'bold');
  doc.text('Accepted by:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptance.clientName, 70, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(acceptance.clientEmail || 'Not provided', 70, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  const acceptedDate = new Date(acceptance.acceptedAt);
  doc.text(acceptedDate.toLocaleString(), 70, currentY);
  currentY += 15;

  // Digital signature section
  if (acceptance.signatureData) {
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signature:', 20, currentY);
    currentY += 10;

    try {
      // Add signature image - convert base64 to image
      const signatureCanvas = document.createElement('canvas');
      const ctx = signatureCanvas.getContext('2d');
      const img = new Image();
      
      // Set canvas size
      signatureCanvas.width = 200;
      signatureCanvas.height = 80;
      
      img.onload = () => {
        if (ctx) {
          // Clear canvas with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
          
          // Draw signature
          ctx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
          
          // Convert to data URL and add to PDF
          const signatureDataUrl = signatureCanvas.toDataURL('image/png');
          doc.addImage(signatureDataUrl, 'PNG', 20, currentY, 80, 32);
        }
      };
      
      img.src = acceptance.signatureData;
      
      // Add placeholder box for signature
      doc.rect(20, currentY, 80, 32);
      currentY += 40;
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      doc.setFont('helvetica', 'italic');
      doc.text('Signature captured digitally', 20, currentY);
      currentY += 15;
    }
  }

  // Technical details (if available)
  if (acceptance.ipAddress || acceptance.userAgent) {
    currentY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Technical Authentication Details:', 20, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    if (acceptance.ipAddress) {
      doc.text(`IP Address: ${acceptance.ipAddress}`, 20, currentY);
      currentY += 5;
    }
    
    if (acceptance.userAgent) {
      // Truncate user agent if too long
      const userAgent = acceptance.userAgent.length > 100 ? 
        acceptance.userAgent.substring(0, 100) + '...' : 
        acceptance.userAgent;
      doc.text(`Browser: ${userAgent}`, 20, currentY);
      currentY += 5;
    }
  }

  // Legal notice
  currentY += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Legal Notice:', 20, currentY);
  currentY += 6;
  
  doc.setFont('helvetica', 'normal');
  const legalText = 'This digital acceptance is legally binding and constitutes an agreement to the terms and conditions outlined in the above quote. The digital signature and associated metadata provide authentication of the acceptance.';
  const legalLines = doc.splitTextToSize(legalText, 170);
  doc.text(legalLines, 20, currentY);
  currentY += legalLines.length * 4;

  return currentY;
};
