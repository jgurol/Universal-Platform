
import { z } from 'zod';
import { secureTextSchema, secureEmailSchema } from './securityUtils';

// Enhanced email validation schema
export const emailSchema = secureEmailSchema;

// Enhanced password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(
    (password) => {
      // Must contain at least one uppercase, lowercase, number, and special character
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      return hasUpper && hasLower && hasNumber && hasSpecial;
    },
    'Password must contain uppercase, lowercase, number, and special character'
  )
  .refine(
    (password) => {
      // No null bytes or control characters
      return !/[\0-\x1f\x7f]/.test(password);
    },
    'Password contains invalid characters'
  );

// Enhanced name validation schema
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .refine(
    (name) => {
      // Allow letters, spaces, hyphens, apostrophes, periods
      return /^[a-zA-Z\s\-'\.]+$/.test(name.trim());
    },
    'Name contains invalid characters'
  )
  .refine(
    (name) => {
      // Prevent XSS attempts in names
      const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
      return !xssPatterns.some(pattern => pattern.test(name));
    },
    'Name contains potentially dangerous content'
  );

// Use secure text content validation
export const textContentSchema = secureTextSchema;

// Enhanced user creation validation schema
export const createUserSchema = z.object({
  email: emailSchema,
  full_name: nameSchema,
  role: z.enum(['admin', 'agent']),
  associated_agent_id: z.string().uuid().optional().nullable(),
  send_welcome_email: z.boolean()
});

// Quote validation schemas
export const quoteDescriptionSchema = secureTextSchema.max(2000, 'Description too long');
export const quoteNotesSchema = secureTextSchema.max(1000, 'Notes too long');

// Sanitize HTML content (now using DOMPurify)
export const sanitizeHtml = (content: string): string => {
  // This now delegates to the more secure implementation
  return require('./securityUtils').sanitizeHtml(content);
};

// Validate and sanitize user input
export const validateAndSanitizeInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Additional validation for quote items
export const validateQuoteItemName = (name: string): boolean => {
  try {
    nameSchema.parse(name);
    return true;
  } catch {
    return false;
  }
};

export const validateQuoteItemDescription = (description: string): boolean => {
  try {
    secureTextSchema.parse(description);
    return true;
  } catch {
    return false;
  }
};
