
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { IndexPageLayout } from "@/components/IndexPageLayout";

const Index = () => {
  const { user, session, loading } = useAuth();

  console.log('Index page - session:', !!session, 'user:', !!user, 'loading:', loading);
  console.log('Index page - session details:', session ? {
    userId: session.user?.id,
    email: session.user?.email,
    expiresAt: session.expires_at,
    currentTime: Date.now() / 1000,
    isExpired: session.expires_at ? session.expires_at <= Date.now() / 1000 : false
  } : null);

  // Show loading state while checking authentication
  if (loading) {
    console.log('Index page - Still loading authentication');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Check both session AND user for complete authentication verification
  // If either is missing, redirect to auth
  if (!session || !user) {
    console.log('Index page - Authentication failed: session exists:', !!session, 'user exists:', !!user);
    console.log('Index page - Redirecting to /auth due to missing authentication');
    return <Navigate to="/auth" replace />;
  }

  // Additional session validation - check if session is expired
  if (session.expires_at && session.expires_at <= Date.now() / 1000) {
    console.log('Index page - Session expired, redirecting to auth', {
      expiresAt: session.expires_at,
      currentTime: Date.now() / 1000
    });
    return <Navigate to="/auth" replace />;
  }

  // Validate that the session user matches the user state
  if (!session.user || session.user.id !== user.id) {
    console.log('Index page - Session user mismatch, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('Index page - User authenticated successfully, rendering dashboard');
  return <IndexPageLayout />;
};

export default Index;
