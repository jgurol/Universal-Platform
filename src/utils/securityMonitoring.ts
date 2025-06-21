
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: 'XSS_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_INPUT' | 'AUTH_FAILURE' | 'SUSPICIOUS_ACTIVITY';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event,
      // Sanitize sensitive data
      details: sanitizeForLog(event.details)
    };

    // Log to console for development
    const logLevel = event.severity === 'critical' ? 'error' : 
                    event.severity === 'high' ? 'warn' : 'info';
    console[logLevel]('Security Event:', logEntry);

    // In production, send to security monitoring service
    // await sendToSecurityService(logEntry);

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const detectSuspiciousActivity = (
  failedAttempts: number, 
  timeWindow: number,
  userAgent?: string
): { suspicious: boolean; reason?: string } => {
  // Rate limiting detection
  if (failedAttempts > 5) {
    return { suspicious: true, reason: 'Excessive failed login attempts' };
  }

  // Suspicious user agent patterns
  if (userAgent) {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /scanner/i,
      /sqlmap/i,
      /nikto/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return { suspicious: true, reason: 'Suspicious user agent detected' };
    }
  }

  return { suspicious: false };
};

export const sanitizeForLog = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'credit_card', 'ssn', 'api_key'
  ];
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  });
  
  return sanitized;
};

// Content Security Policy violation handler
export const handleCSPViolation = (violationReport: any) => {
  logSecurityEvent({
    event_type: 'XSS_ATTEMPT',
    severity: 'high',
    details: {
      type: 'CSP_VIOLATION',
      blockedURI: violationReport['blocked-uri'],
      violatedDirective: violationReport['violated-directive'],
      sourceFile: violationReport['source-file'],
      lineNumber: violationReport['line-number']
    }
  });
};

// Monitor for XSS attempts in user input
export const monitorForXSS = (input: string, context: string) => {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  const detectedPatterns = xssPatterns.filter(pattern => pattern.test(input));
  
  if (detectedPatterns.length > 0) {
    logSecurityEvent({
      event_type: 'XSS_ATTEMPT',
      severity: 'high',
      details: {
        context,
        input: input.substring(0, 200), // Truncate for logging
        detectedPatterns: detectedPatterns.map(p => p.toString())
      }
    });
    return true;
  }
  
  return false;
};
