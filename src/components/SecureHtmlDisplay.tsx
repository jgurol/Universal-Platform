
import React from 'react';
import { sanitizeHtml } from '@/utils/securityUtils';
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
  
  let displayContent = content;
  
  // Truncate if maxLength is specified
  if (maxLength && content.length > maxLength) {
    // Remove HTML tags for length calculation
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length > maxLength) {
      displayContent = content.substring(0, maxLength) + '...';
    }
  }
  
  const sanitizedContent = sanitizeHtml(displayContent);
  
  return (
    <div 
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
