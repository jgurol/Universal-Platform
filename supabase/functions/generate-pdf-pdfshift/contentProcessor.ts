
import { ProcessedContent } from './types.ts';

// Helper function to process HTML/Rich text content and extract images
export const processRichTextContent = (content: string): ProcessedContent => {
  if (!content) return { html: '', images: [] };
  
  console.log('PDFShift Function - Processing rich text content:', content.substring(0, 200));
  
  // Extract image URLs using regex
  const imageRegex = /<img[^>]+src="([^"]*)"[^>]*>/g;
  const images: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
    console.log('PDFShift Function - Found image URL:', match[1].substring(0, 100));
  }
  
  // Convert HTML to a cleaner format for PDF
  const cleanHtml = content
    .replace(/<img[^>]*>/g, '') // Remove img tags for now, we'll handle them separately
    .replace(/<strong>(.*?)<\/strong>/g, '<b>$1</b>')
    .replace(/<em>(.*?)<\/em>/g, '<i>$1</i>')
    .replace(/<br\s*\/?>/g, '<br>')
    .replace(/<\/p><p>/g, '</p><p>')
    .replace(/&nbsp;/g, ' ')
    .trim();
    
  console.log('PDFShift Function - Processed HTML length:', cleanHtml.length);
  console.log('PDFShift Function - Found images count:', images.length);
  
  return { html: cleanHtml, images };
};

// Enhanced function to process template content with proper paragraph and section formatting
export const processTemplateContent = (content: string): string => {
  if (!content) return '';
  
  console.log('PDFShift Function - Processing template content:', content.substring(0, 200));
  
  // First, clean up the content and normalize HTML
  let processedContent = content
    // Remove any existing HTML formatting that might interfere
    .replace(/<img[^>]*>/g, '') // Remove images
    .replace(/&nbsp;/g, ' ') // Replace HTML spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Process bold/strong text patterns - both HTML and markdown-style
  processedContent = processedContent
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/\*\*\*\*\*\*(.*?)\*\*\*\*\*\*/g, '**$1**') // Fix excessive asterisks
    .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '**$1**'); // Fix quadruple asterisks
  
  // Handle line breaks and paragraphs properly
  processedContent = processedContent
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p><p[^>]*>/g, '\n\n')
    .replace(/<p[^>]*>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '');
  
  // Clean up remaining HTML tags but preserve content
  processedContent = processedContent
    .replace(/<\/?(?:span|font|em|i|u)[^>]*>/g, '')
    .replace(/<\/?(ul|ol|li)[^>]*>/g, '');
  
  // Split into sections and process each one
  const sections = processedContent.split(/\n\s*\n/);
  const formattedSections = sections
    .filter(section => section.trim().length > 0)
    .map(section => {
      const trimmed = section.trim();
      
      // Check if this looks like a header (starts with **text** or has numbered pattern)
      const headerMatch = trimmed.match(/^\*\*([^*]+)\*\*(.*)$/);
      if (headerMatch) {
        const headerText = headerMatch[1].trim();
        const bodyText = headerMatch[2].trim();
        
        return `<div style="font-weight: bold; margin: 12px 0 6px 0; font-size: 10px; color: #333;">${headerText}</div>` +
               (bodyText ? `<div style="margin: 6px 0; line-height: 1.5; font-size: 10px;">${bodyText}</div>` : '');
      }
      
      // Check if it's a numbered section (like "1. Term and Renewal")
      const numberedHeaderMatch = trimmed.match(/^(\d+\.\s*)(.+?)(?:\*\*(.+?)\*\*)?(.*)$/);
      if (numberedHeaderMatch) {
        const number = numberedHeaderMatch[1];
        const title = numberedHeaderMatch[2].trim();
        const boldPart = numberedHeaderMatch[3] || '';
        const rest = numberedHeaderMatch[4] || '';
        
        const headerText = number + title + (boldPart ? ' ' + boldPart : '');
        
        return `<div style="font-weight: bold; margin: 12px 0 6px 0; font-size: 10px; color: #333;">${headerText}</div>` +
               (rest.trim() ? `<div style="margin: 6px 0; line-height: 1.5; font-size: 10px;">${rest.trim()}</div>` : '');
      }
      
      // Regular paragraph
      return `<div style="margin: 6px 0; line-height: 1.5; font-size: 10px;">${trimmed}</div>`;
    });
  
  const result = formattedSections.join('');
  console.log('PDFShift Function - Processed template content length:', result.length);
  
  return result;
};
