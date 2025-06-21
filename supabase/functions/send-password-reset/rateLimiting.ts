
import type { RateLimitRecord } from './types.ts';

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, RateLimitRecord>();

export const checkRateLimit = (ip: string, maxAttempts: number = 3, windowMs: number = 300000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};
