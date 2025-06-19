
import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .refine(
    (email) => {
      // Prevent email header injection
      const dangerousChars = /[\r\n\0%]/;
      return !dangerousChars.test(email);
    },
    'Invalid email format'
  );

// Password validation schema
export const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password too long')
  .refine(
    (password) => {
      // Basic security check - no null bytes or control characters
      return !/[\0-\x1f\x7f]/.test(password);
    },
    'Password contains invalid characters'
  );

// Name validation schema
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .refine(
    (name) => {
      // Allow letters, spaces, hyphens, apostrophes, periods
      return /^[a-zA-Z\s\-'\.]+$/.test(name.trim());
    },
    'Name contains invalid characters'
  );

// Text content validation (for notes, descriptions, etc.)
export const textContentSchema = z.string()
  .max(5000, 'Text too long')
  .refine(
    (text) => {
      // Remove or escape potential XSS attempts
      const dangerousPatterns = /<script|javascript:|data:|vbscript:/i;
      return !dangerousPatterns.test(text);
    },
    'Content contains potentially dangerous elements'
  );

// User creation validation schema
export const createUserSchema = z.object({
  email: emailSchema,
  full_name: nameSchema,
  role: z.enum(['admin', 'agent']),
  associated_agent_id: z.string().uuid().optional().nullable(),
  send_welcome_email: z.boolean()
});

// Sanitize HTML content
export const sanitizeHtml = (content: string): string => {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate and sanitize user input
export const validateAndSanitizeInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};
