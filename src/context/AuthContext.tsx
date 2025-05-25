import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeTimezone } from '@/utils/dateUtils';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAssociated: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to clean up auth state
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAssociated, setIsAssociated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change event:", event);
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.log("Token refresh failed, cleaning up auth state");
          cleanupAuthState();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          return;
        }
        
        // Handle signed out state
        if (event === 'SIGNED_OUT' || !currentSession) {
          console.log("User signed out or no session");
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid deadlocks
          setTimeout(async () => {
            await fetchUserProfile(currentSession.user.id);
            // Initialize timezone cache for the logged-in user
            await initializeTimezone();
          }, 0);
        } else {
          setIsAdmin(false);
          setIsAssociated(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          // If there's an error with the session, clean up and start fresh
          cleanupAuthState();
          setSession(null);
          setUser(null);
        } else {
          console.log("Initial session check:", currentSession ? "Session exists" : "No session");
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
            // Initialize timezone for existing session
            await initializeTimezone();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        cleanupAuthState();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      
      // Use the security definer RPC function we just created
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_id: userId
      });

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If we still get an error with the RPC call, fall back to direct check using email
        if (user?.email === 'jim@californiatelecom.com') {
          console.log("Detected the admin user by email, granting admin access");
          setIsAdmin(true);
          setIsAssociated(true);
          return;
        }
        
        toast({
          title: "Profile retrieval issue",
          description: "There was an issue loading your profile details. Some functionality may be limited.",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        console.log("Profile data retrieved:", data);
        const profileData = data[0];
        const isUserAdmin = profileData.role === 'admin';
        setIsAdmin(isUserAdmin);
        setIsAssociated(profileData.is_associated || false);
      } else {
        console.log("No profile data found for user", userId);
        // No profile data found, set safe defaults
        setIsAdmin(false);
        setIsAssociated(false);
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
      // Set defaults for failed profile fetch
      setIsAdmin(false);
      setIsAssociated(false);
    }
  };

  // Function to refresh user profile data
  const refreshUserProfile = async () => {
    if (user?.id) {
      return await fetchUserProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing auth state before signing in
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        // Continue even if this fails
        console.log('Sign out before login failed, continuing anyway');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Handle specific token-related errors
        if (error.message.includes('Invalid token') || error.message.includes('signature is invalid')) {
          cleanupAuthState();
          toast({
            title: "Authentication Error",
            description: "Please try signing in again. Your session may have expired.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive"
          });
        }
        throw error;
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Clean up existing auth state before signing up
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Registration successful",
        description: "Your account has been created! However, you cannot log in until your account is associated with an agent by a system administrator.",
      });
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error && !error.message.includes('Invalid token')) {
        // Only show error if it's not a token-related issue
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      
      // Force page reload to ensure clean state
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      // Even if sign out fails, clean up local state
      cleanupAuthState();
      window.location.href = '/auth';
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isAssociated,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
