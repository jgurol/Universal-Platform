import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

const Auth = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showUpdatePasswordForm, setShowUpdatePasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset_token');
    
    if (token) {
      console.log('Password reset token found in URL');
      setResetToken(token);
      setShowUpdatePasswordForm(true);
      setActiveTab("none");
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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
      
      console.log('Sending password reset request for:', email);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });
      
      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Password reset failed",
          description: "Failed to send password reset email. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
      
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
      console.log("Custom password update flow started");
      setIsSubmitting(true);
      
      if (!resetToken) {
        setTokenError("No reset token found. Please request a new password reset.");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          token: resetToken,
          newPassword: password
        }
      });
      
      if (error || !data?.success) {
        console.error("Password update error:", error);
        const errorMessage = data?.error || "Failed to update password. Please try again.";
        
        if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
          setTokenError(errorMessage);
        }
        
        toast({
          title: "Password Update Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      console.log("Password updated successfully");
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      setShowUpdatePasswordForm(false);
      setTokenError(null);
      setResetToken(null);
      setActiveTab("login");
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/e5be9154-ed00-490e-b242-16319351487f.png" 
                  alt="California Telecom" 
                  className="h-16 w-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
              <CardDescription>Please enter your new password</CardDescription>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm 
                onUpdatePassword={handleUpdatePasswordSubmit}
                onCancel={handleBackToLogin}
                isSubmitting={isSubmitting}
                tokenError={tokenError}
                isCheckingSession={isCheckingSession}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render the password reset form
  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/e5be9154-ed00-490e-b242-16319351487f.png" 
                  alt="California Telecom" 
                  className="h-16 w-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm 
                onResetPassword={handleResetPasswordSubmit}
                onCancel={() => setShowResetForm(false)}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render the login/register tabs
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/e5be9154-ed00-490e-b242-16319351487f.png" 
                alt="California Telecom" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Universal Platform</CardTitle>
            <CardDescription>Sign in to manage your business operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm 
                  onLogin={handleLoginSubmit}
                  onForgotPassword={() => setShowResetForm(true)}
                  isSubmitting={isSubmitting}
                />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm
                  onRegister={handleRegisterSubmit}
                  isSubmitting={isSubmitting}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
