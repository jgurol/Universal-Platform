
export const generateTemplateSection = (templateContent: string) => {
  if (!templateContent) {
    return '';
  }

  console.log('PDFShift Function - Processing template content:', templateContent.substring(0, 100) + '...');
  
  // Process template content - convert markdown-like formatting to HTML
  let processedContent = templateContent
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert line breaks to paragraphs
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');

  console.log('PDFShift Function - Processed template content length:', processedContent.length);
  
  return processedContent;
};
