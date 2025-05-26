
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { addMarkdownTextToPDF } from '../markdownToPdf';
import { PDFGenerationContext } from './types';

export const addTemplateContent = async (doc: jsPDF, context: PDFGenerationContext, startY: number): Promise<number> => {
  let yPos = startY;
  
  // Get template content if templateId is provided
  let templateContent = '';
  if ((context.quote as any).templateId) {
    try {
      const { data: template, error } = await supabase
        .from('quote_templates')
        .select('content')
        .eq('id', (context.quote as any).templateId)
        .single();
      
      if (error) {
        console.error('Error fetching template for PDF:', error);
      } else if (template) {
        templateContent = template.content;
      }
    } catch (error) {
      console.error('Error fetching template for PDF:', error);
    }
  }
  
  // Template content section (Terms & Conditions)
  if (templateContent && templateContent.trim()) {
    yPos += 15;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Terms & Conditions:', 10, yPos);
    yPos += 8;
    
    const finalY = addMarkdownTextToPDF(doc, templateContent, 10, yPos, 190);
    yPos = finalY;
  }
  
  return yPos;
};

export const addNotes = (doc: jsPDF, context: PDFGenerationContext, startY: number): number => {
  let yPos = startY;
  
  // Notes section
  if (context.quote.notes) {
    const remainingSpace = 297 - 10 - yPos;
    
    if (remainingSpace < 25) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', 10, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(context.quote.notes, 190);
    doc.text(splitNotes, 10, yPos);
    yPos += Array.isArray(splitNotes) ? splitNotes.length * 4 : 4;
  }
  
  return yPos;
};
