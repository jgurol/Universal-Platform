
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import QuotingSystem from "@/pages/QuotingSystem";
import AcceptQuote from "@/pages/AcceptQuote";
import CircuitQuotes from "@/pages/CircuitQuotes";
import Billing from "@/pages/Billing";
import AgentManagement from "@/pages/AgentManagement";
import DealRegistration from "@/pages/DealRegistration";
import ClientManagement from "@/pages/ClientManagement";
import CircuitTracking from "@/pages/CircuitTracking";
import Templates from "@/pages/Templates";
import SystemSettings from "@/pages/SystemSettings";
import ProfileSettings from "@/pages/ProfileSettings";
import Vendors from "@/pages/Vendors";
import SpeedsManagement from "@/pages/SpeedsManagement";
import OrdersManagement from "@/pages/OrdersManagement";
import NotFound from "@/pages/NotFound";
import FixAccount from "@/pages/FixAccount";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/accept-quote/:quoteId" element={<AcceptQuote />} />
                  <Route path="/fix-account" element={<FixAccount />} />
                  
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/quoting-system" element={<ProtectedRoute><QuotingSystem /></ProtectedRoute>} />
                  <Route path="/circuit-quotes" element={<ProtectedRoute><CircuitQuotes /></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                  <Route path="/agent-management" element={<ProtectedRoute><AgentManagement /></ProtectedRoute>} />
                  <Route path="/deal-registration" element={<ProtectedRoute><DealRegistration /></ProtectedRoute>} />
                  <Route path="/client-management" element={<ProtectedRoute><ClientManagement /></ProtectedRoute>} />
                  <Route path="/circuit-tracking" element={<ProtectedRoute><CircuitTracking /></ProtectedRoute>} />
                  <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                  <Route path="/system-settings" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} />
                  <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                  <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
                  <Route path="/speeds-management" element={<ProtectedRoute><SpeedsManagement /></ProtectedRoute>} />
                  <Route path="/orders-management" element={<ProtectedRoute><OrdersManagement /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
