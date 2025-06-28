
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
  
  // Ultra-aggressive HTML stripping function
  const stripAllHtml = (html: string): string => {
    if (!html) return '';
    
    console.log('SecureHtmlDisplay - Starting HTML strip for:', html.substring(0, 100) + '...');
    
    try {
      let cleanText = html;
      
      // First: Remove all HTML tags completely
      cleanText = cleanText.replace(/<[^>]*>/g, '');
      console.log('SecureHtmlDisplay - After tag removal:', cleanText.substring(0, 100) + '...');
      
      // Second: Decode common HTML entities
      cleanText = cleanText
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
      
      // Third: Remove any remaining HTML entities (anything that looks like &...;)
      cleanText = cleanText.replace(/&[a-zA-Z0-9#]+;/g, '');
      
      // Fourth: Clean up excessive whitespace
      cleanText = cleanText.replace(/\s+/g, ' ').trim();
      
      console.log('SecureHtmlDisplay - Final cleaned text:', cleanText);
      return cleanText;
      
    } catch (error) {
      console.error('Error stripping HTML:', error);
      // Ultra-aggressive fallback
      const fallbackText = html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('SecureHtmlDisplay - Fallback text:', fallbackText);
      return fallbackText;
    }
  };
  
  let plainText = stripAllHtml(content);
  
  // Truncate if maxLength is specified
  if (maxLength && plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength) + '...';
  }
  
  console.log('SecureHtmlDisplay - Final output text:', plainText);
  
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {plainText}
    </div>
  );
};
