
import React from 'react';
import { cn } from '@/lib/utils';

interface SecureHtmlDisplayProps {
  content: string;
  className?: string;
  maxLength?: number;
}

export const SecureHtmlDisplay: React.FC<SecureHtmlDisplayProps> = ({ 
  content, 
  className,
  maxLength 
}) => {
  if (!content) return null;
  
  console.log('SecureHtmlDisplay - Raw content:', content);
  
  // Comprehensive HTML stripping function
  const stripAllHtml = (html: string): string => {
    if (!html) return '';
    
    try {
      // First pass: decode HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = html;
      let decodedHtml = textarea.value;
      
      // Second pass: remove all HTML tags using regex
      decodedHtml = decodedHtml.replace(/<[^>]*>/g, '');
      
      // Third pass: create DOM element to extract pure text content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = decodedHtml;
      let textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Clean up whitespace and special characters
      textContent = textContent
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      return textContent;
    } catch (error) {
      console.error('Error stripping HTML:', error);
      // Fallback: aggressive regex replacement
      return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
    }
  };
  
  let plainText = stripAllHtml(content);
  
  // Truncate if maxLength is specified
  if (maxLength && plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength) + '...';
  }
  
  console.log('SecureHtmlDisplay - Final plain text output:', plainText);
  
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {plainText}
    </div>
  );
};
