
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { usePasswordResetHandler } from "@/components/auth/PasswordResetHandler";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showUpdatePasswordForm, setShowUpdatePasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  usePasswordResetHandler({
    onShowUpdatePasswordForm: (token: string) => {
      setResetToken(token);
      setShowUpdatePasswordForm(true);
      setActiveTab("none");
      setTokenError(null);
    },
    onTokenError: setTokenError
  });

  const handleLoginSubmit = async (email: string, password: string) => {
    try {
      setIsSubmitting(true);
      await signIn(email, password);
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (email: string, password: string, fullName: string) => {
    try {
      setIsSubmitting(true);
      await signUp(email, password, fullName);
      setActiveTab("login");
    } catch (error) {
      console.error("Error during registration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (email: string) => {
    try {
      setIsSubmitting(true);
      
      console.log('Sending custom password reset request for:', email);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });
      
      if (error) {
        console.error('Custom password reset error:', error);
        toast({
          title: "Password reset failed",
          description: "Failed to send password reset email. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('Custom password reset response:', data);
      
      toast({
        title: "Password Reset Email Sent",
        description: "If an account with that email exists, a password reset link has been sent. Please check your email.",
      });
      setShowResetForm(false);
      setActiveTab("login");
    } catch (error) {
      console.error("Error during password reset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdatePasswordSubmit = async (password: string) => {
    try {
      console.log("Custom password update flow started with token:", resetToken);
      setIsSubmitting(true);
      
      if (!resetToken) {
        setTokenError("No reset token found. Please request a new password reset.");
        return;
      }
      
      console.log('Calling reset-password function with token');
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          token: resetToken,
          newPassword: password
        }
      });
      
      console.log('Reset password response:', { data, error });
      
      if (error || !data?.success) {
        console.error("Password update error:", error);
        const errorMessage = data?.error || error?.message || "Failed to update password. Please try again.";
        
        if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
          setTokenError(errorMessage);
        } else {
          toast({
            title: "Password Update Failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
        return;
      }
      
      console.log("Password updated successfully");
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      // Reset all password reset related state
      setShowUpdatePasswordForm(false);
      setTokenError(null);
      setResetToken(null);
      
      // Don't just set the tab - force a redirect to ensure clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Password Update Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    console.log('Going back to login');
    setTokenError(null);
    setShowUpdatePasswordForm(false);
    setShowResetForm(false);
    setResetToken(null);
    setActiveTab("login");
  };

  if (user) {
    return <Navigate to="/" />;
  }

  // Render the password update form
  if (showUpdatePasswordForm) {
    console.log('Rendering update password form with token:', resetToken);
    return (
      <AuthContainer 
        title="Set New Password" 
        description="Please enter your new password"
      >
        <UpdatePasswordForm 
          onUpdatePassword={handleUpdatePasswordSubmit}
          onCancel={handleBackToLogin}
          isSubmitting={isSubmitting}
          tokenError={tokenError}
          isCheckingSession={isCheckingSession}
        />
      </AuthContainer>
    );
  }

  // Render the password reset form
  if (showResetForm) {
    return (
      <AuthContainer 
        title="Reset Password" 
        description="Enter your email to receive a password reset link"
      >
        <ResetPasswordForm 
          onResetPassword={handleResetPasswordSubmit}
          onCancel={() => setShowResetForm(false)}
          isSubmitting={isSubmitting}
        />
      </AuthContainer>
    );
  }

  // Render the login/register tabs
  return (
    <AuthContainer 
      title="Universal Platform" 
      description="Sign in to manage your business operations"
    >
      <AuthTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogin={handleLoginSubmit}
        onRegister={handleRegisterSubmit}
        onForgotPassword={() => setShowResetForm(true)}
        isSubmitting={isSubmitting}
      />
    </AuthContainer>
  );
};

export default Auth;
