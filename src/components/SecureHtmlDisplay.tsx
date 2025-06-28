
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
  
  // Strip all HTML tags to get plain text - more robust approach
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    // First, decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    const decodedHtml = textarea.value;
    
    // Create a temporary div element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = decodedHtml;
    
    // Extract text content only, removing all HTML tags
    let textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Remove extra whitespace and line breaks
    textContent = textContent.replace(/\s+/g, ' ').trim();
    
    return textContent;
  };
  
  let plainText = stripHtml(content);
  
  // Truncate if maxLength is specified
  if (maxLength && plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength) + '...';
  }
  
  console.log('SecureHtmlDisplay - Plain text output:', plainText);
  
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {plainText}
    </div>
  );
};
