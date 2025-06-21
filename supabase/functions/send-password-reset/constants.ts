
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export const RATE_LIMIT_MAX_ATTEMPTS = 3;
export const RATE_LIMIT_WINDOW_MS = 300000; // 5 minutes
export const TOKEN_EXPIRY_HOURS = 1;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PAYLOAD_SIZE = 1000;
