
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Enhanced HTML sanitization
export const sanitizeHtml = (content: string): string => {
  if (!content) return '';
  
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'img', 'a', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'target'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

// Safe HTML display component wrapper
export const createSafeHtmlProps = (content: string) => ({
  dangerouslySetInnerHTML: { __html: sanitizeHtml(content) }
});

// Enhanced validation schemas
export const secureTextSchema = z.string()
  .max(10000, 'Content too long')
  .refine(
    (text) => {
      // Check for common XSS patterns
      const xssPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /data:text\/html/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi,
        /onmouseover\s*=/gi
      ];
      
      return !xssPatterns.some(pattern => pattern.test(text));
    },
    'Content contains potentially dangerous elements'
  );

export const secureEmailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .refine(
    (email) => {
      // Prevent email header injection
      const dangerousChars = /[\r\n\0%<>]/;
      return !dangerousChars.test(email);
    },
    'Invalid email format'
  );

// Rate limiting utilities
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};

// Security event logging
export const logSecurityEvent = (event: {
  type: 'XSS_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_INPUT' | 'AUTH_FAILURE';
  details: Record<string, any>;
  userAgent?: string;
  ip?: string;
}) => {
  console.warn('[SECURITY EVENT]', {
    timestamp: new Date().toISOString(),
    ...event
  });
  
  // In production, you would send this to a security monitoring service
};
