
import { MAX_EMAIL_LENGTH } from './constants.ts';

// Enhanced email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dangerousChars = /[\r\n\0%<>]/;
  return emailRegex.test(email) && !dangerousChars.test(email) && email.length <= MAX_EMAIL_LENGTH;
};

export const validatePayloadSize = (body: string, maxSize: number): boolean => {
  return body.length <= maxSize;
};
