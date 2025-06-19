
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeTimezone } from '@/utils/dateUtils';

interface UserProfile {
  full_name?: string;
  email?: string;
  role?: string;
  timezone?: string;
}

// Type for the RPC response
interface UserProfileRPCResponse {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_associated: boolean;
  associated_agent_id: string;
  timezone: string;
}

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
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to clean up auth state
const cleanupAuthState = () => {
  console.log('AuthProvider: Cleaning up auth state');
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('AuthProvider: Removing localStorage key:', key);
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('AuthProvider: Removing sessionStorage key:', key);
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isAssociated, setIsAssociated] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider: Starting initialization');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("AuthProvider: Auth state change event:", event, "Session exists:", !!currentSession);
        console.log("AuthProvider: Session details:", currentSession ? {
          userId: currentSession.user?.id,
          email: currentSession.user?.email,
          expiresAt: currentSession.expires_at,
          currentTime: Date.now() / 1000
        } : null);
        
        if (!mounted) return;
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.log("AuthProvider: Token refresh failed, cleaning up auth state");
          cleanupAuthState();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        // Handle signed out state or no session
        if (event === 'SIGNED_OUT' || !currentSession) {
          console.log("AuthProvider: User signed out or no session - clearing all state");
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        // Validate session expiration IMMEDIATELY
        if (currentSession.expires_at && currentSession.expires_at <= Date.now() / 1000) {
          console.log("AuthProvider: Session expired immediately upon receipt", {
            expiresAt: currentSession.expires_at,
            currentTime: Date.now() / 1000
          });
          cleanupAuthState();
          await supabase.auth.signOut({ scope: 'global' });
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        console.log("AuthProvider: Setting valid session and user", currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid deadlocks
          setTimeout(async () => {
            if (mounted) {
              console.log("AuthProvider: Fetching user profile for", currentSession.user.id);
              await fetchUserProfile(currentSession.user.id);
              // Initialize timezone cache for the logged-in user
              await initializeTimezone();
              setLoading(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        console.log("AuthProvider: Checking for existing session");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("AuthProvider: Error getting session:", error);
          // If there's an error with the session, clean up and start fresh
          cleanupAuthState();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
        } else if (!currentSession) {
          console.log("AuthProvider: Initial session check: No session found - user is not authenticated");
          // Explicitly set all auth state to null/false when no session
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
        } else {
          console.log("AuthProvider: Initial session check result:", currentSession ? `Session exists for ${currentSession.user?.email}` : "No session found");
          
          // CRITICAL: Validate session expiration immediately
          if (currentSession.expires_at && currentSession.expires_at <= Date.now() / 1000) {
            console.log("AuthProvider: Existing session is expired", {
              expiresAt: currentSession.expires_at,
              currentTime: Date.now() / 1000
            });
            cleanupAuthState();
            await supabase.auth.signOut({ scope: 'global' });
            setSession(null);
            setUser(null);
            setIsAdmin(false);
            setIsAssociated(false);
            setUserProfile(null);
            setLoading(false);
          } else if (currentSession.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            console.log("AuthProvider: Valid session found, fetching profile");
            await fetchUserProfile(currentSession.user.id);
            // Initialize timezone for existing session
            await initializeTimezone();
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("AuthProvider: Error initializing auth:", error);
        if (mounted) {
          cleanupAuthState();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsAssociated(false);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log("AuthProvider: Cleaning up");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("AuthProvider: Fetching user profile for ID:", userId);
      
      // Use the security definer RPC function we just created
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_id: userId
      }) as { data: UserProfileRPCResponse[] | null; error: any };

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        
        // If we still get an error with the RPC call, fall back to direct check using email
        if (user?.email === 'jim@californiatelecom.com') {
          console.log("AuthProvider: Detected the admin user by email, granting admin access");
          setIsAdmin(true);
          setIsAssociated(true);
          setUserProfile({
            full_name: 'Jim',
            email: user?.email,
            role: 'admin'
          });
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
        console.log("AuthProvider: Profile data retrieved:", data);
        const profileData = data[0];
        const isUserAdmin = profileData.role === 'admin';
        console.log("AuthProvider: Setting admin status:", isUserAdmin, "associated:", profileData.is_associated);
        setIsAdmin(isUserAdmin);
        setIsAssociated(profileData.is_associated || false);
        
        // Set the user profile data
        setUserProfile({
          full_name: profileData.full_name,
          email: profileData.email,
          role: profileData.role,
          timezone: profileData.timezone
        });
      } else {
        console.log("AuthProvider: No profile data found for user", userId);
        // No profile data found, set safe defaults
        setIsAdmin(false);
        setIsAssociated(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('AuthProvider: Error in profile fetch:', error);
      // Set defaults for failed profile fetch
      setIsAdmin(false);
      setIsAssociated(false);
      setUserProfile(null);
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
      setLoading(true);
      console.log("AuthProvider: Starting sign in process for", email);
      
      // Clean up existing auth state before signing in
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        // Continue even if this fails
        console.log('AuthProvider: Sign out before login failed, continuing anyway');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("AuthProvider: Sign in error:", error);
        setLoading(false);
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
      
      console.log("AuthProvider: Sign in successful");
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('AuthProvider: Error signing in:', error.message);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
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
        setLoading(false);
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
      setLoading(false);
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("AuthProvider: Starting sign out process");
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Clear component state immediately
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setIsAssociated(false);
      setUserProfile(null);
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error && !error.message.includes('Invalid token')) {
        // Only show error if it's not a token-related issue
        console.error("AuthProvider: Sign out error:", error);
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("AuthProvider: Sign out successful");
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
      
      // Force page reload to ensure clean state
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('AuthProvider: Error signing out:', error.message);
      // Even if sign out fails, clean up local state
      cleanupAuthState();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setIsAssociated(false);
      setUserProfile(null);
      window.location.href = '/auth';
    }
  };

  console.log("AuthProvider: Rendering with state - user:", !!user, "session:", !!session, "loading:", loading, "isAdmin:", isAdmin);

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
    userProfile,
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
