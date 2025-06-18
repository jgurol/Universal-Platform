
import jsPDF from 'jspdf';

interface TextSection {
  text: string;
  bold: boolean;
  italic: boolean;
}

// Enhanced content parser for PDF generation that handles both HTML and markdown
export const addMarkdownTextToPDF = (
  doc: jsPDF, 
  content: string, 
  startX: number, 
  startY: number, 
  maxWidth: number, 
  lineHeight: number = 3.5
): number => {
  let currentY = startY;
  const pageHeight = 297;
  const bottomMargin = 24;
  const topMargin = 10;
  const paragraphSpacing = 3;
  
  if (!content) return currentY;
  
  console.log('PDF Generation - Processing content:', content);
  console.log('PDF Generation - Content length:', content.length);
  
  // Check if content is HTML (contains HTML tags) or markdown
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  
  let cleanContent;
  if (isHtml) {
    // Handle HTML content from ReactQuill
    cleanContent = content
      .replace(/<img[^>]*>/g, '') // Remove image tags
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**') // Convert strong to markdown
      .replace(/<em>(.*?)<\/em>/g, '*$1*') // Convert em to markdown
      .replace(/<u>(.*?)<\/u>/g, '__$1__') // Convert u to markdown
      .replace(/<br\s*\/?>/g, '\n') // Convert br to newlines
      .replace(/<\/p><p>/g, '\n\n') // Convert p tags to paragraphs
      .replace(/<p>/g, '') // Remove opening p tags
      .replace(/<\/p>/g, '') // Remove closing p tags
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .trim();
  } else {
    // Handle markdown content
    cleanContent = content
      .replace(/&nbsp;/g, ' ') // Replace HTML spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .trim();
  }
  
  console.log('PDF Generation - Cleaned content length:', cleanContent.length);
  console.log('PDF Generation - First 200 chars:', cleanContent.substring(0, 200));
  
  // Split content into paragraphs - better handling of line breaks
  const paragraphs = cleanContent
    .split(/\n\s*\n|\r\n\s*\r\n/) // Split on double newlines for paragraphs
    .map(p => p.replace(/\n/g, ' ').trim()) // Convert single newlines to spaces within paragraphs
    .filter(p => p.length > 0);
  
  console.log('PDF Generation - Number of paragraphs found:', paragraphs.length);
  console.log('PDF Generation - Paragraphs:', paragraphs.map((p, i) => `${i + 1}: ${p.substring(0, 100)}...`));
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    console.log(`PDF Generation - Processing paragraph ${paragraphIndex + 1}:`, paragraph.substring(0, 100));
    
    // Add spacing between paragraphs (except first one)
    if (paragraphIndex > 0) {
      currentY += paragraphSpacing;
    }
    
    // Parse the paragraph for inline formatting
    const sections = parseMarkdownInline(paragraph);
    console.log(`PDF Generation - Paragraph ${paragraphIndex + 1} sections:`, sections.length);
    
    // Estimate paragraph height to check if it fits on current page
    const estimatedParagraphHeight = calculateParagraphHeight(doc, sections, maxWidth, lineHeight);
    const spaceRemaining = pageHeight - bottomMargin - currentY;
    
    console.log(`PDF Generation - Paragraph estimated height: ${estimatedParagraphHeight}, space remaining: ${spaceRemaining}`);
    
    // If paragraph doesn't fit on current page, move to next page
    if (estimatedParagraphHeight > spaceRemaining && currentY > topMargin + 20) {
      console.log('PDF Generation - Moving entire paragraph to next page');
      doc.addPage();
      currentY = topMargin;
      
      // Add header on new page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions (continued):', startX, currentY);
      currentY += 8;
    }
    
    // Process each section of the paragraph with improved text flow
    currentY = addSectionsWithImprovedFlow(doc, sections, startX, currentY, maxWidth, lineHeight);
    
    // Move to next line after paragraph
    currentY += paragraphSpacing;
    console.log(`PDF Generation - Finished paragraph ${paragraphIndex + 1}, current Y:`, currentY);
  });
  
  console.log('PDF Generation - Final Y position:', currentY);
  return currentY;
};

// New function to add sections with improved text flow
const addSectionsWithImprovedFlow = (
  doc: jsPDF,
  sections: TextSection[],
  startX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number => {
  let currentY = startY;
  let currentX = startX;
  const pageHeight = 297;
  const bottomMargin = 24;
  const topMargin = 10;
  
  // Combine all sections into one continuous text flow
  let combinedText = '';
  let formatMap: Array<{ start: number; end: number; bold: boolean; italic: boolean }> = [];
  
  sections.forEach(section => {
    const startPos = combinedText.length;
    combinedText += section.text;
    const endPos = combinedText.length;
    
    formatMap.push({
      start: startPos,
      end: endPos,
      bold: section.bold,
      italic: section.italic
    });
  });
  
  // Use jsPDF's built-in text splitting for better word wrapping
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const textLines = doc.splitTextToSize(combinedText, maxWidth);
  
  if (Array.isArray(textLines)) {
    textLines.forEach((line: string) => {
      // Check if we need a new page
      if (currentY > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = topMargin;
        
        // Add header on new page
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions (continued):', startX, currentY);
        currentY += 8;
        doc.setFont('helvetica', 'normal');
      }
      
      // Add the line with proper formatting
      addFormattedLine(doc, line, startX, currentY, combinedText, formatMap);
      currentY += lineHeight;
    });
  } else {
    // Single line case
    addFormattedLine(doc, textLines, startX, currentY, combinedText, formatMap);
    currentY += lineHeight;
  }
  
  return currentY;
};

// Function to add a line with proper formatting
const addFormattedLine = (
  doc: jsPDF,
  line: string,
  x: number,
  y: number,
  fullText: string,
  formatMap: Array<{ start: number; end: number; bold: boolean; italic: boolean }>
) => {
  // Find the position of this line in the full text
  const lineStart = fullText.indexOf(line);
  if (lineStart === -1) {
    // Fallback: just add the line as normal text
    doc.setFont('helvetica', 'normal');
    doc.text(line, x, y);
    return;
  }
  
  const lineEnd = lineStart + line.length;
  let currentX = x;
  
  // Process each character in the line to apply correct formatting
  for (let i = 0; i < line.length; i++) {
    const charPos = lineStart + i;
    const char = line[i];
    
    // Find the format for this character
    const format = formatMap.find(f => charPos >= f.start && charPos < f.end);
    
    if (format) {
      // Set font style
      if (format.bold && format.italic) {
        doc.setFont('helvetica', 'bolditalic');
      } else if (format.bold) {
        doc.setFont('helvetica', 'bold');
      } else if (format.italic) {
        doc.setFont('helvetica', 'italic');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    // Add the character
    doc.text(char, currentX, y);
    currentX += doc.getTextWidth(char);
  }
};

// Helper function to calculate paragraph height
const calculateParagraphHeight = (doc: jsPDF, sections: TextSection[], maxWidth: number, lineHeight: number): number => {
  // Combine all text for accurate measurement
  const combinedText = sections.map(s => s.text).join('');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const textLines = doc.splitTextToSize(combinedText, maxWidth);
  const numberOfLines = Array.isArray(textLines) ? textLines.length : 1;
  
  return numberOfLines * lineHeight;
};

// Enhanced markdown inline formatting parser
const parseMarkdownInline = (text: string): TextSection[] => {
  const sections: TextSection[] = [];
  let currentIndex = 0;
  
  console.log('Parsing inline markdown for text:', text.substring(0, 100));
  
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
        console.log('Found bold text:', boldText.substring(0, 30));
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
        console.log('Found italic text:', italicText.substring(0, 30));
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
      console.log('Found regular text:', regularText.substring(0, 30));
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
    console.log('No formatting found, added as regular text');
  }
  
  console.log('Total sections created:', sections.length);
  return sections;
};
