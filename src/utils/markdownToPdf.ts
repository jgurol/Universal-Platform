
import jsPDF from 'jspdf';

interface TextSection {
  text: string;
  bold: boolean;
  italic: boolean;
}

// Simple and reliable markdown parser for PDF generation
export const addMarkdownTextToPDF = (
  doc: jsPDF, 
  markdownContent: string, 
  startX: number, 
  startY: number, 
  maxWidth: number, 
  lineHeight: number = 4
): number => {
  let currentY = startY;
  const pageHeight = 297;
  const bottomMargin = 20;
  const topMargin = 20;
  const paragraphSpacing = 2;
  
  if (!markdownContent) return currentY;
  
  console.log('PDF Generation - Processing markdown content:', markdownContent);
  
  // Split content into paragraphs (double newlines)
  const paragraphs = markdownContent
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  console.log('PDF Generation - Paragraphs found:', paragraphs.length);
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    // Add spacing between paragraphs (except first one)
    if (paragraphIndex > 0) {
      currentY += paragraphSpacing;
    }
    
    // Parse the paragraph for inline formatting
    const sections = parseMarkdownInline(paragraph);
    
    sections.forEach(section => {
      // Check if we need a new page
      if (currentY > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = topMargin;
        
        // Add header on new page
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions (continued):', startX, currentY);
        currentY += 8;
      }
      
      // Set font style
      doc.setFontSize(8);
      if (section.bold && section.italic) {
        doc.setFont('helvetica', 'bolditalic');
      } else if (section.bold) {
        doc.setFont('helvetica', 'bold');
      } else if (section.italic) {
        doc.setFont('helvetica', 'italic');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      // Handle line breaks within sections
      const lines = section.text.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          currentY += lineHeight;
        }
        
        if (line.trim()) {
          // Split text to fit within the specified width
          const splitText = doc.splitTextToSize(line, maxWidth);
          doc.text(splitText, startX, currentY);
          currentY += splitText.length * lineHeight;
        }
      });
    });
  });
  
  return currentY;
};

// Parse markdown inline formatting (**bold**, *italic*)
const parseMarkdownInline = (text: string): TextSection[] => {
  const sections: TextSection[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    // Look for **bold** (must come before *italic* check)
    const boldMatch = text.substring(currentIndex).match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      const boldText = boldMatch[1];
      if (boldText) {
        sections.push({
          text: boldText,
          bold: true,
          italic: false
        });
      }
      currentIndex += boldMatch[0].length;
      continue;
    }
    
    // Look for *italic*
    const italicMatch = text.substring(currentIndex).match(/^\*(.*?)\*/);
    if (italicMatch) {
      const italicText = italicMatch[1];
      if (italicText) {
        sections.push({
          text: italicText,
          bold: false,
          italic: true
        });
      }
      currentIndex += italicMatch[0].length;
      continue;
    }
    
    // Regular text - find the next formatting marker or end of string
    let nextMarkerIndex = text.length;
    const nextBold = text.indexOf('**', currentIndex);
    const nextItalic = text.indexOf('*', currentIndex);
    
    if (nextBold !== -1) {
      nextMarkerIndex = Math.min(nextMarkerIndex, nextBold);
    }
    if (nextItalic !== -1) {
      nextMarkerIndex = Math.min(nextMarkerIndex, nextItalic);
    }
    
    const regularText = text.substring(currentIndex, nextMarkerIndex);
    if (regularText) {
      sections.push({
        text: regularText,
        bold: false,
        italic: false
      });
    }
    
    currentIndex = nextMarkerIndex;
  }
  
  // If no sections were created, add the whole text as regular
  if (sections.length === 0 && text.trim()) {
    sections.push({
      text: text,
      bold: false,
      italic: false
    });
  }
  
  return sections;
};
