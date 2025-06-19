
// Secure random generation utilities

export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
};

export const generateSecureToken = (): string => {
  const array = new Uint8Array(32); // 256-bit token
  crypto.getRandomValues(array);
  
  // Convert to hex string
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  return Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyToken = async (token: string, hashedToken: string): Promise<boolean> => {
  const tokenHash = await hashToken(token);
  return tokenHash === hashedToken;
};
