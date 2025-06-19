
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PasswordResetHandlerProps {
  onShowUpdatePasswordForm: (token: string) => void;
  onTokenError: (error: string) => void;
}

export const usePasswordResetHandler = ({ onShowUpdatePasswordForm, onTokenError }: PasswordResetHandlerProps) => {
  const location = useLocation();
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    console.log('Current URL:', window.location.href);
    console.log('Location search:', location.search);
    
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('reset_token');
    
    console.log('Extracted reset token:', token);
    
    if (token) {
      console.log('Password reset token found in URL:', token);
      setResetToken(token);
      onShowUpdatePasswordForm(token);
      
      // Clean up URL without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
      
      // Reset any existing errors
      onTokenError('');
    }
  }, [location.search, onShowUpdatePasswordForm, onTokenError]);

  return { resetToken };
};
