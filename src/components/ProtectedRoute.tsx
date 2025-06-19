
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, session, loading, isAdmin } = useAuth();

  console.log('ProtectedRoute - session:', !!session, 'user:', !!user, 'loading:', loading, 'isAdmin:', isAdmin);
  console.log('ProtectedRoute - session details:', session ? {
    userId: session.user?.id,
    email: session.user?.email,
    expiresAt: session.expires_at,
    currentTime: Date.now() / 1000,
    isExpired: session.expires_at ? session.expires_at <= Date.now() / 1000 : false
  } : null);

  // Show loading state while checking authentication
  if (loading) {
    console.log('ProtectedRoute - Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Check both session AND user to ensure complete authentication
  if (!session || !user) {
    console.log('ProtectedRoute - No valid session or user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Verify session is still valid by checking expiration
  if (session.expires_at && session.expires_at <= Date.now() / 1000) {
    console.log('ProtectedRoute - Session expired, redirecting to auth', {
      expiresAt: session.expires_at,
      currentTime: Date.now() / 1000
    });
    return <Navigate to="/auth" replace />;
  }

  // Validate that the session user matches the user state
  if (!session.user || session.user.id !== user.id) {
    console.log('ProtectedRoute - Session user mismatch, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect to dashboard if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute - Admin required but user is not admin, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - User authenticated successfully, rendering children');
  return <>{children}</>;
};
