import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import QuotingSystem from "./pages/QuotingSystem";
import AgentManagement from "./pages/AgentManagement";
import ClientManagement from "./pages/ClientManagement";
import DealRegistration from "./pages/DealRegistration";
import DIDManagement from "./pages/DIDManagement";
import LNPPorting from "./pages/LNPPorting";
import SystemSettings from "./pages/SystemSettings";
import ProfileSettings from "./pages/ProfileSettings";
import Billing from "./pages/Billing";
import FixAccount from "./pages/FixAccount";
import AcceptQuote from "./pages/AcceptQuote";
import CircuitTracking from "./pages/CircuitTracking";
import CircuitQuotes from "./pages/CircuitQuotes";
import Vendors from "./pages/Vendors";
import OrdersManagement from "./pages/OrdersManagement";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import AgentAgreement from "@/pages/AgentAgreement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SystemSettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/accept-quote/:quoteId" element={<AcceptQuote />} />
                <Route path="/agent-agreement/:token" element={<AgentAgreement />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/quoting-system" element={
                  <ProtectedRoute>
                    <QuotingSystem />
                  </ProtectedRoute>
                } />
                <Route path="/agent-management" element={
                  <ProtectedRoute requireAdmin>
                    <AgentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/client-management" element={
                  <ProtectedRoute>
                    <ClientManagement />
                  </ProtectedRoute>
                } />
                <Route path="/deal-registration" element={
                  <ProtectedRoute>
                    <DealRegistration />
                  </ProtectedRoute>
                } />
                <Route path="/did-management" element={
                  <ProtectedRoute>
                    <DIDManagement />
                  </ProtectedRoute>
                } />
                <Route path="/lnp-porting" element={
                  <ProtectedRoute>
                    <LNPPorting />
                  </ProtectedRoute>
                } />
                <Route path="/system-settings" element={
                  <ProtectedRoute requireAdmin>
                    <SystemSettings />
                  </ProtectedRoute>
                } />
                <Route path="/settings/profile" element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                } />
                <Route path="/fix-account" element={
                  <ProtectedRoute>
                    <FixAccount />
                  </ProtectedRoute>
                } />
                <Route path="/circuit-tracking" element={
                  <ProtectedRoute>
                    <CircuitTracking />
                  </ProtectedRoute>
                } />
                <Route path="/circuit-quotes" element={
                  <ProtectedRoute>
                    <CircuitQuotes />
                  </ProtectedRoute>
                } />
                <Route path="/vendors" element={
                  <ProtectedRoute>
                    <Vendors />
                  </ProtectedRoute>
                } />
                <Route path="/orders-management" element={
                  <ProtectedRoute requireAdmin>
                    <OrdersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/templates" element={
                  <ProtectedRoute requireAdmin>
                    <Templates />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </SystemSettingsProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
