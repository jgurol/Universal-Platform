
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
  
  console.log('SecureHtmlDisplay - Raw content:', content);
  
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
  console.log('SecureHtmlDisplay - Sanitized content:', sanitizedContent);
  
  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none", 
        "[&_img]:inline [&_img]:align-middle [&_img]:mr-2 [&_img]:max-w-full [&_img]:h-auto",
        "[&_p]:mb-2 [&_p]:leading-relaxed [&_p]:inline",
        "[&>p]:inline [&>p>img]:inline [&>p>*]:inline-block",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
