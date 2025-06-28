
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
  
  // Strip all HTML tags to get plain text
  const stripHtml = (html: string): string => {
    // Create a temporary div element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extract text content only
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  let plainText = stripHtml(content);
  
  // Truncate if maxLength is specified
  if (maxLength && plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength) + '...';
  }
  
  console.log('SecureHtmlDisplay - Plain text:', plainText);
  
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {plainText}
    </div>
  );
};
