
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
  const { user, loading, isAdmin } = useAuth();

  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'isAdmin:', isAdmin);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    console.log('ProtectedRoute - No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect to dashboard if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute - Admin required but user is not admin, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - User authenticated, rendering children');
  return <>{children}</>;
};
