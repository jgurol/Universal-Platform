
export interface PasswordResetRequest {
  email: string;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number;
}
