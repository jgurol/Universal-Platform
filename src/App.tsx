
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import FixAccount from "./pages/FixAccount";
import ClientManagement from "./pages/ClientManagement";
import AgentManagement from "./pages/AgentManagement";
import ProfileSettings from "./pages/ProfileSettings";
import Billing from "./pages/Billing";
import SystemSettings from "./pages/SystemSettings";
import QuotingSystem from "./pages/QuotingSystem";
import { NavigationBar } from "./components/NavigationBar";

// Create a new query client with forceRefetch to ensure fresh data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 60000, // 1 minute
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  // Removed the isAssociated check to allow all authenticated users to access the protected routes
  return <>{children}</>;
};

// Admin route component - keeping this separate for when you implement admin-only pages later
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      {user && <NavigationBar />}
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/fix-account" element={<FixAccount />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/quoting-system" element={
          <ProtectedRoute>
            <QuotingSystem />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />
        <Route path="/client-management" element={
          <ProtectedRoute>
            <ClientManagement />
          </ProtectedRoute>
        } />
        <Route path="/agent-management" element={
          <ProtectedRoute>
            <AgentManagement />
          </ProtectedRoute>
        } />
        <Route path="/settings/profile" element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        } />
        <Route path="/settings/billing" element={
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        } />
        <Route path="/settings/system" element={
          <AdminRoute>
            <SystemSettings />
          </AdminRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
