
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // In a production environment, you would typically send this to a logging service
    // For now, we'll log to console and could extend to store in a security_logs table
    console.warn('Security Event:', {
      timestamp: new Date().toISOString(),
      ...event
    });

    // If you want to store security events in the database, you could create a security_logs table
    // and insert the event there
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const detectSuspiciousActivity = (failedAttempts: number, timeWindow: number): boolean => {
  // Simple rate limiting detection
  return failedAttempts > 5; // More than 5 failed attempts
};

export const sanitizeForLog = (data: any): any => {
  // Remove sensitive data from logs
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  return data;
};
