
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
  
  // Ultra-simple HTML stripping function
  const stripAllHtml = (html: string): string => {
    if (!html) return '';
    
    console.log('SecureHtmlDisplay - Starting HTML strip for:', html.substring(0, 100) + '...');
    
    // Step 1: Remove all HTML tags completely
    let cleanText = html.replace(/<[^>]*>/g, '');
    console.log('SecureHtmlDisplay - After removing HTML tags:', cleanText);
    
    // Step 2: Decode HTML entities manually
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®');
    
    // Step 3: Remove any remaining HTML entities
    cleanText = cleanText.replace(/&[a-zA-Z0-9#]+;/g, '');
    
    // Step 4: Clean up whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    console.log('SecureHtmlDisplay - Final cleaned text:', cleanText);
    return cleanText;
  };
  
  let plainText = stripAllHtml(content);
  
  // Truncate if maxLength is specified
  if (maxLength && plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength) + '...';
  }
  
  console.log('SecureHtmlDisplay - Final output text:', plainText);
  
  // Return just the plain text without any HTML wrapper
  return (
    <span className={cn("text-sm leading-relaxed", className)}>
      {plainText}
    </span>
  );
};
