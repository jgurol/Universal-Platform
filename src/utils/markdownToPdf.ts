
import jsPDF from 'jspdf';

interface TextSection {
  text: string;
  bold: boolean;
  italic: boolean;
}

// Enhanced markdown parser for PDF generation with better formatting
export const addMarkdownTextToPDF = (
  doc: jsPDF, 
  markdownContent: string, 
  startX: number, 
  startY: number, 
  maxWidth: number, 
  lineHeight: number = 5
): number => {
  let currentY = startY;
  const pageHeight = 297;
  const bottomMargin = 20;
  const topMargin = 20;
  const paragraphSpacing = 6; // Increased paragraph spacing
  
  if (!markdownContent) return currentY;
  
  console.log('PDF Generation - Processing markdown content:', markdownContent);
  
  // Clean up the content first - remove any HTML remnants
  const cleanContent = markdownContent
    .replace(/<[^>]*>/g, '') // Remove any HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Split content into paragraphs (double newlines or single newlines for now)
  const paragraphs = cleanContent
    .split(/\n\s*\n/) // Split on double newlines with optional whitespace
    .map(p => p.replace(/\n/g, ' ').trim()) // Convert single newlines to spaces and trim
    .filter(p => p.length > 0);
  
  console.log('PDF Generation - Cleaned paragraphs found:', paragraphs.length);
  console.log('PDF Generation - Paragraphs:', paragraphs);
  
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
        currentY += 10;
      }
      
      // Set font style
      doc.setFontSize(9); // Slightly larger font for better readability
      if (section.bold && section.italic) {
        doc.setFont('helvetica', 'bolditalic');
      } else if (section.bold) {
        doc.setFont('helvetica', 'bold');
      } else if (section.italic) {
        doc.setFont('helvetica', 'italic');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      if (section.text.trim()) {
        // Split text to fit within the specified width
        const splitText = doc.splitTextToSize(section.text, maxWidth);
        
        // Add each line of the split text
        if (Array.isArray(splitText)) {
          splitText.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
              currentY += lineHeight;
            }
            doc.text(line, startX, currentY);
          });
          // Move to next line position for next section
          if (splitText.length > 1) {
            currentY += lineHeight * (splitText.length - 1);
          }
        } else {
          doc.text(splitText, startX, currentY);
        }
      }
    });
    
    // Move to next line after each section group
    currentY += lineHeight;
  });
  
  return currentY;
};

// Enhanced markdown inline formatting parser
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
