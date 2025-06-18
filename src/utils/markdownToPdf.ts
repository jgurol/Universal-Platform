
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
  
  console.log('PDF Generation - Cleaned content:', cleanContent);
  
  // Split content into paragraphs - better handling of line breaks
  const paragraphs = cleanContent
    .split(/\n\s*\n|\r\n\s*\r\n/) // Split on double newlines for paragraphs
    .map(p => p.replace(/\n/g, ' ').trim()) // Convert single newlines to spaces within paragraphs
    .filter(p => p.length > 0);
  
  console.log('PDF Generation - Number of paragraphs:', paragraphs.length);
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    console.log(`PDF Generation - Processing paragraph ${paragraphIndex + 1}:`, paragraph.substring(0, 100));
    
    // Add spacing between paragraphs (except first one)
    if (paragraphIndex > 0) {
      currentY += paragraphSpacing;
    }
    
    // Check if we need a new page before processing paragraph
    if (currentY > pageHeight - bottomMargin - 20) {
      console.log('PDF Generation - Moving to next page');
      doc.addPage();
      currentY = topMargin;
      
      // Add header on new page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions (continued):', startX, currentY);
      currentY += 8;
    }
    
    // Parse the paragraph for inline formatting
    const sections = parseMarkdownInline(paragraph);
    console.log(`PDF Generation - Paragraph ${paragraphIndex + 1} sections:`, sections.length);
    
    // Process paragraph with proper text wrapping - using simple approach
    currentY = addParagraphSimple(doc, sections, startX, currentY, maxWidth, lineHeight);
    
    console.log(`PDF Generation - Finished paragraph ${paragraphIndex + 1}, current Y:`, currentY);
  });
  
  console.log('PDF Generation - Final Y position:', currentY);
  return currentY;
};

// Simplified paragraph rendering that respects formatting but uses proper word wrapping
const addParagraphSimple = (
  doc: jsPDF,
  sections: TextSection[],
  startX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number => {
  let currentY = startY;
  const pageHeight = 297;
  const bottomMargin = 24;
  const topMargin = 10;
  
  // Combine all text from sections to get the full paragraph text
  const fullText = sections.map(s => s.text).join('');
  
  // Set base font for text measurement
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Split text into words to handle wrapping properly
  const words = fullText.split(/\s+/);
  let currentLine = '';
  let currentX = startX;
  
  // Track which section we're in for formatting
  let sectionIndex = 0;
  let sectionCharIndex = 0;
  let currentSection = sections[0];
  
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    // Check if adding this word would exceed the line width
    const testWidth = doc.getTextWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      // Output current line first
      outputLineWithFormatting(doc, currentLine, sections, startX, currentY, sectionIndex, sectionCharIndex);
      
      // Move to next line
      currentY += lineHeight;
      
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
      
      // Update section tracking for the characters we just output
      const lineLength = currentLine.length + 1; // +1 for space
      for (let i = 0; i < lineLength; i++) {
        if (currentSection && sectionCharIndex >= currentSection.text.length) {
          sectionIndex++;
          sectionCharIndex = 0;
          currentSection = sections[sectionIndex];
        }
        if (currentSection) {
          sectionCharIndex++;
        }
      }
      
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  // Output remaining text
  if (currentLine) {
    outputLineWithFormatting(doc, currentLine, sections, startX, currentY, sectionIndex, sectionCharIndex);
    currentY += lineHeight;
  }
  
  return currentY;
};

// Helper function to output a line with proper formatting
const outputLineWithFormatting = (
  doc: jsPDF,
  lineText: string,
  sections: TextSection[],
  startX: number,
  y: number,
  startSectionIndex: number,
  startSectionCharIndex: number
): void => {
  let currentX = startX;
  let sectionIndex = startSectionIndex;
  let sectionCharIndex = startSectionCharIndex;
  let currentSection = sections[sectionIndex];
  let currentText = '';
  
  for (let charIndex = 0; charIndex < lineText.length; charIndex++) {
    const char = lineText[charIndex];
    
    // Move to next section if we've exhausted current section
    while (currentSection && sectionCharIndex >= currentSection.text.length) {
      // Output accumulated text with current formatting
      if (currentText) {
        // Set font for current section
        doc.setFontSize(9);
        if (currentSection.bold && currentSection.italic) {
          doc.setFont('helvetica', 'bolditalic');
        } else if (currentSection.bold) {
          doc.setFont('helvetica', 'bold');
        } else if (currentSection.italic) {
          doc.setFont('helvetica', 'italic');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(currentText, currentX, y);
        currentX += doc.getTextWidth(currentText);
        currentText = '';
      }
      
      sectionIndex++;
      sectionCharIndex = 0;
      currentSection = sections[sectionIndex];
    }
    
    if (currentSection && sectionCharIndex < currentSection.text.length) {
      currentText += char;
      sectionCharIndex++;
    }
  }
  
  // Output any remaining text
  if (currentText && currentSection) {
    // Set font for current section
    doc.setFontSize(9);
    if (currentSection.bold && currentSection.italic) {
      doc.setFont('helvetica', 'bolditalic');
    } else if (currentSection.bold) {
      doc.setFont('helvetica', 'bold');
    } else if (currentSection.italic) {
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    doc.text(currentText, currentX, y);
  }
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
