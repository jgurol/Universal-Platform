
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
      .replace(/<b>(.*?)<\/b>/g, '**$1**') // Convert b to markdown
      .replace(/<em>(.*?)<\/em>/g, '*$1*') // Convert em to markdown
      .replace(/<i>(.*?)<\/i>/g, '*$1*') // Convert i to markdown
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
    
    // Process paragraph with proper text wrapping
    currentY = addFormattedParagraph(doc, sections, startX, currentY, maxWidth, lineHeight);
    
    console.log(`PDF Generation - Finished paragraph ${paragraphIndex + 1}, current Y:`, currentY);
  });
  
  console.log('PDF Generation - Final Y position:', currentY);
  return currentY;
};

// Add formatted paragraph that preserves bold/italic formatting
const addFormattedParagraph = (
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
  
  // Build lines with proper word wrapping
  const lines: TextSection[][] = [];
  let currentLine: TextSection[] = [];
  let currentLineWidth = 0;
  
  // Process each section
  for (const section of sections) {
    const words = section.text.split(/\s+/).filter(word => word.length > 0);
    
    for (const word of words) {
      // Set font to measure text width accurately
      doc.setFontSize(9);
      setFontStyle(doc, section.bold, section.italic);
      
      const wordWidth = doc.getTextWidth(word);
      const spaceWidth = doc.getTextWidth(' ');
      
      // Check if adding this word would exceed the line width
      const testWidth = currentLineWidth + (currentLineWidth > 0 ? spaceWidth : 0) + wordWidth;
      
      if (testWidth > maxWidth && currentLine.length > 0) {
        // Start a new line
        lines.push([...currentLine]);
        currentLine = [];
        currentLineWidth = 0;
      }
      
      // Add word to current line
      if (currentLine.length === 0) {
        // First word on line
        currentLine.push({
          text: word,
          bold: section.bold,
          italic: section.italic
        });
        currentLineWidth = wordWidth;
      } else {
        // Check if we can merge with the last section (same formatting)
        const lastSection = currentLine[currentLine.length - 1];
        if (lastSection.bold === section.bold && lastSection.italic === section.italic) {
          lastSection.text += ' ' + word;
          currentLineWidth += spaceWidth + wordWidth;
        } else {
          // Different formatting, create new section
          currentLine.push({
            text: ' ' + word,
            bold: section.bold,
            italic: section.italic
          });
          currentLineWidth += spaceWidth + wordWidth;
        }
      }
    }
  }
  
  // Add the last line if it has content
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  // Render each line
  for (const line of lines) {
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
    
    // Render the line with proper formatting
    let currentX = startX;
    for (const section of line) {
      // Apply font style for each section
      doc.setFontSize(9);
      setFontStyle(doc, section.bold, section.italic);
      
      console.log(`Rendering section: "${section.text}" - Bold: ${section.bold}, Italic: ${section.italic}`);
      
      // Render the text
      doc.text(section.text, currentX, currentY);
      
      // Move X position for next section
      currentX += doc.getTextWidth(section.text);
    }
    
    currentY += lineHeight;
  }
  
  return currentY;
};

// Helper function to set font style consistently
const setFontStyle = (doc: jsPDF, bold: boolean, italic: boolean) => {
  if (bold && italic) {
    doc.setFont('helvetica', 'bolditalic');
    console.log('Setting font to bolditalic');
  } else if (bold) {
    doc.setFont('helvetica', 'bold');
    console.log('Setting font to bold');
  } else if (italic) {
    doc.setFont('helvetica', 'italic');
    console.log('Setting font to italic');
  } else {
    doc.setFont('helvetica', 'normal');
    console.log('Setting font to normal');
  }
};

// Enhanced markdown inline formatting parser
const parseMarkdownInline = (text: string): TextSection[] => {
  const sections: TextSection[] = [];
  let currentIndex = 0;
  
  console.log('Parsing inline markdown for text:', text.substring(0, 100));
  
  while (currentIndex < text.length) {
    // Look for **bold** (must come before *italic* check)
    const boldMatch = text.substring(currentIndex).match(/^\*\*(.*?)\*\*/s);
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
    const italicMatch = text.substring(currentIndex).match(/^\*(.*?)\*/s);
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
    
    // Look for the next ** or * that isn't escaped
    for (let i = currentIndex; i < text.length; i++) {
      if (text[i] === '*') {
        nextMarkerIndex = i;
        break;
      }
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
    
    // Safety check to prevent infinite loops
    if (currentIndex === nextMarkerIndex && nextMarkerIndex < text.length) {
      currentIndex++;
    }
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
