
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
  lineHeight: number = 3.5 // Reduced from 4
): number => {
  let currentY = startY;
  const pageHeight = 297;
  const bottomMargin = 24; // Increased from 10 to 24 (4 lines * 6 points per line)
  const topMargin = 10; // Reduced from 20
  const paragraphSpacing = 3; // Reduced from 6
  
  if (!markdownContent) return currentY;
  
  console.log('PDF Generation - Processing markdown content:', markdownContent);
  console.log('PDF Generation - Content length:', markdownContent.length);
  
  // Clean up the content thoroughly
  let cleanContent = markdownContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
  
  console.log('PDF Generation - Cleaned content length:', cleanContent.length);
  console.log('PDF Generation - First 200 chars:', cleanContent.substring(0, 200));
  
  // Split content into paragraphs - better handling of line breaks
  const paragraphs = cleanContent
    .split(/\n\s*\n|\r\n\s*\r\n/) // Split on double newlines for paragraphs
    .map(p => p.trim()) // Don't convert single newlines to spaces yet
    .filter(p => p.length > 0);
  
  console.log('PDF Generation - Number of paragraphs found:', paragraphs.length);
  console.log('PDF Generation - Paragraphs:', paragraphs.map((p, i) => `${i + 1}: ${p.substring(0, 100)}...`));
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    console.log(`PDF Generation - Processing paragraph ${paragraphIndex + 1}:`, paragraph.substring(0, 100));
    
    // Add spacing between paragraphs (except first one)
    if (paragraphIndex > 0) {
      currentY += paragraphSpacing;
    }
    
    // Split paragraph into lines (preserve single line breaks)
    const lines = paragraph.split(/\n|\r\n/).map(line => line.trim()).filter(line => line.length > 0);
    console.log(`PDF Generation - Paragraph ${paragraphIndex + 1} has ${lines.length} lines`);
    
    // Estimate paragraph height to check if it fits on current page
    const estimatedParagraphHeight = lines.length * lineHeight + (lines.length - 1) * lineHeight + paragraphSpacing;
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
    
    lines.forEach((line, lineIndex) => {
      console.log(`PDF Generation - Processing line ${lineIndex + 1}:`, line.substring(0, 50));
      
      // Parse the line for inline formatting
      const sections = parseMarkdownInline(line);
      console.log(`PDF Generation - Line ${lineIndex + 1} sections:`, sections.length);
      
      let isFirstSectionInLine = true;
      
      sections.forEach((section, sectionIndex) => {
        console.log(`PDF Generation - Processing section ${sectionIndex + 1}:`, section.text.substring(0, 50));
        
        // Check if we need a new page (only for individual sections, not whole paragraphs)
        if (currentY > pageHeight - bottomMargin) {
          console.log('PDF Generation - Adding new page at Y:', currentY);
          doc.addPage();
          currentY = topMargin;
          
          // Add header on new page
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Terms & Conditions (continued):', startX, currentY);
          currentY += 8; // Reduced from 10
        }
        
        // Set font style
        doc.setFontSize(9);
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
          console.log(`PDF Generation - Split text into ${Array.isArray(splitText) ? splitText.length : 1} lines`);
          
          // Add each line of the split text
          if (Array.isArray(splitText)) {
            splitText.forEach((textLine, textLineIndex) => {
              if (textLineIndex > 0 || !isFirstSectionInLine) {
                currentY += lineHeight;
              }
              
              // Check for page break within a section
              if (currentY > pageHeight - bottomMargin) {
                console.log('PDF Generation - Adding new page within section at Y:', currentY);
                doc.addPage();
                currentY = topMargin;
                
                // Add header on new page
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Terms & Conditions (continued):', startX, currentY);
                currentY += 8; // Reduced from 10
                
                // Reset font style after header
                if (section.bold && section.italic) {
                  doc.setFont('helvetica', 'bolditalic');
                } else if (section.bold) {
                  doc.setFont('helvetica', 'bold');
                } else if (section.italic) {
                  doc.setFont('helvetica', 'italic');
                } else {
                  doc.setFont('helvetica', 'normal');
                }
              }
              
              doc.text(textLine, startX, currentY);
              console.log(`PDF Generation - Added line at Y ${currentY}:`, textLine.substring(0, 30));
            });
          } else {
            if (!isFirstSectionInLine) {
              currentY += lineHeight;
            }
            
            // Check for page break
            if (currentY > pageHeight - bottomMargin) {
              console.log('PDF Generation - Adding new page for single line at Y:', currentY);
              doc.addPage();
              currentY = topMargin;
              
              // Add header on new page
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.text('Terms & Conditions (continued):', startX, currentY);
              currentY += 8; // Reduced from 10
              
              // Reset font style after header
              if (section.bold && section.italic) {
                doc.setFont('helvetica', 'bolditalic');
              } else if (section.bold) {
                doc.setFont('helvetica', 'bold');
              } else if (section.italic) {
                doc.setFont('helvetica', 'italic');
              } else {
                doc.setFont('helvetica', 'normal');
              }
            }
            
            doc.text(splitText, startX, currentY);
            console.log(`PDF Generation - Added single line at Y ${currentY}:`, splitText.substring(0, 30));
          }
          
          isFirstSectionInLine = false;
        }
      });
      
      // Add line break after each line within a paragraph
      if (lineIndex < lines.length - 1) {
        currentY += lineHeight;
        console.log(`PDF Generation - Added line break after line ${lineIndex + 1}, current Y:`, currentY);
      }
    });
    
    // Add paragraph break after each paragraph - reduced spacing
    currentY += lineHeight + 2; // Reduced from lineHeight + 4
    console.log(`PDF Generation - Finished paragraph ${paragraphIndex + 1}, current Y:`, currentY);
  });
  
  console.log('PDF Generation - Final Y position:', currentY);
  return currentY;
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
