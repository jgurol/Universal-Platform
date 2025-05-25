
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
  lineHeight: number = 4
): number => {
  let currentY = startY;
  const pageHeight = 297;
  const bottomMargin = 20;
  const topMargin = 20;
  const paragraphSpacing = 6; // Increased spacing between paragraphs
  
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
  
  // Split content into paragraphs - handle various paragraph separators
  const paragraphs = cleanContent
    .split(/\n\s*\n|\r\n\s*\r\n/) // Split on double newlines
    .map(p => p.replace(/\n/g, ' ').replace(/\r/g, ' ').trim()) // Convert single newlines to spaces
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
    
    let isFirstSectionInParagraph = true;
    
    sections.forEach((section, sectionIndex) => {
      console.log(`PDF Generation - Processing section ${sectionIndex + 1}:`, section.text.substring(0, 50));
      
      // Check if we need a new page
      if (currentY > pageHeight - bottomMargin) {
        console.log('PDF Generation - Adding new page at Y:', currentY);
        doc.addPage();
        currentY = topMargin;
        
        // Add header on new page
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions (continued):', startX, currentY);
        currentY += 10;
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
          splitText.forEach((line, lineIndex) => {
            if (lineIndex > 0 || !isFirstSectionInParagraph) {
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
              currentY += 10;
              
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
            
            doc.text(line, startX, currentY);
            console.log(`PDF Generation - Added line at Y ${currentY}:`, line.substring(0, 30));
          });
        } else {
          if (!isFirstSectionInParagraph) {
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
            currentY += 10;
            
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
        
        isFirstSectionInParagraph = false;
      }
    });
    
    // Add line break after each paragraph - this is the key fix
    currentY += lineHeight + 4; // Extra line break for paragraph separation
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
