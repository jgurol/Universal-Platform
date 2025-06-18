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
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Debug the current URL and hash
  useEffect(() => {
    console.log('Current URL:', window.location.href);
    console.log('Current URL hash:', window.location.hash);
    
    // Log session information
    supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session check:', data.session);
    });
  }, []);
  
  // Check if we have a password reset token in the URL
  useEffect(() => {
    const checkForPasswordReset = async () => {
      // When a user clicks the reset password link in their email,
      // they will be redirected to this page with a special hash parameter
      const hash = window.location.hash;
      console.log('Checking for password reset. Hash:', hash);
      
      if (hash && hash.includes('type=recovery')) {
        console.log('Password reset flow detected');
        setShowUpdatePasswordForm(true);
        setActiveTab("none"); // Ensure tabs don't show
        setIsCheckingSession(true);
        
        try {
          // Clear any prior token errors
          setTokenError(null);
          
          // Parse the URL hash to get access token
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('token_type');
          const expiresIn = hashParams.get('expires_in');
          
          console.log('Recovery tokens found:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenType,
            expiresIn
          });
          
          if (!accessToken) {
            console.error('No access token found in URL');
            setTokenError("Password reset link is missing required authentication token. Please request a new password reset.");
            setIsCheckingSession(false);
            return;
          }
          
          // Clear any existing sessions first
          await supabase.auth.signOut();
          
          // Set the session with the token from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('Error setting session:', error);
            
            // Provide more specific error messages
            let errorMessage = "The password reset link is invalid or has expired.";
            if (error.message.includes('invalid')) {
              errorMessage = "The password reset link contains an invalid token. Please request a new password reset.";
            } else if (error.message.includes('expired')) {
              errorMessage = "The password reset link has expired. Please request a new password reset.";
            } else if (error.message.includes('signature')) {
              errorMessage = "The password reset link signature is invalid. This may happen if the link was modified or corrupted. Please request a new password reset.";
            }
            
            setTokenError(errorMessage);
            toast({
              title: "Reset Link Error",
              description: errorMessage,
              variant: "destructive"
            });
          } else if (data.session) {
            console.log('Successfully set session for password reset:', data.session.user?.email);
            toast({
              title: "Reset Link Valid",
              description: "Please enter your new password below",
            });
          } else {
            console.error('No session returned after setting tokens');
            setTokenError("Unable to establish session with reset tokens. Please request a new password reset.");
          }
        } catch (err) {
          console.error('Error during recovery flow:', err);
          setTokenError("An unexpected error occurred while processing the reset link. Please try requesting a new password reset.");
        } finally {
          setIsCheckingSession(false);
        }
      } else {
        setIsCheckingSession(false);
      }
    };
    
    // Run the password reset check
    checkForPasswordReset();
  }, [toast]);

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
      
      // Use the deployed URL instead of localhost
      const currentUrl = window.location.origin;
      
      // Check if we're on localhost and use the production URL instead
      const isLocalhost = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
      const redirectUrl = isLocalhost 
        ? 'https://34d679df-b261-47ea-b136-e7aae591255b.lovableproject.com/auth'
        : `${currentUrl}/auth`;
      
      console.log('Sending password reset email:', {
        email,
        redirectUrl,
        isLocalhost
      });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a password reset link. The link will be valid for 1 hour.",
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
      console.log("Update password flow started");
      setIsSubmitting(true);
      
      // Get the current session to verify we have the right context
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current session before password update:", sessionData.session?.user?.email);
      
      if (!sessionData.session) {
        setTokenError("Your password reset session has expired. Please request a new password reset link.");
        toast({
          title: "Session Expired",
          description: "Your password reset session has expired. Please request a new password reset link.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error("Password update error:", error);
        
        let errorMessage = "Failed to update password. Please try again.";
        if (error.message.includes('session')) {
          errorMessage = "Your password reset session has expired. Please request a new password reset link.";
          setTokenError(errorMessage);
        }
        
        toast({
          title: "Password Update Failed",
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("Password updated successfully");
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      
      // Sign out the user so they can log in with their new password
      await supabase.auth.signOut();
      
      setShowUpdatePasswordForm(false);
      setTokenError(null);
      setActiveTab("login");
    } catch (error) {
      console.error("Error updating password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setTokenError(null);
    setShowUpdatePasswordForm(false);
    setShowResetForm(false);
    setActiveTab("login");
    // Clear the hash from URL
    window.history.replaceState(null, '', window.location.pathname);
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
