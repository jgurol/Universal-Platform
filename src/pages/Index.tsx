
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { IndexPageLayout } from "@/components/IndexPageLayout";

// Re-export types for backward compatibility
export type { Client, Quote, ClientInfo, Transaction, QuoteItem } from "@/types/index";

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <IndexPageLayout />;
};

export default Index;
