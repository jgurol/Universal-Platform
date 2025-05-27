
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import QuotingSystem from "./pages/QuotingSystem";
import AgentManagement from "./pages/AgentManagement";
import ClientManagement from "./pages/ClientManagement";
import SystemSettings from "./pages/SystemSettings";
import ProfileSettings from "./pages/ProfileSettings";
import Billing from "./pages/Billing";
import FixAccount from "./pages/FixAccount";
import AcceptQuote from "./pages/AcceptQuote";
import CircuitTracking from "./pages/CircuitTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/quoting-system" element={<QuotingSystem />} />
            <Route path="/agent-management" element={<AgentManagement />} />
            <Route path="/client-management" element={<ClientManagement />} />
            <Route path="/system-settings" element={<SystemSettings />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/fix-account" element={<FixAccount />} />
            <Route path="/accept-quote/:quoteId" element={<AcceptQuote />} />
            <Route path="/circuit-tracking" element={<CircuitTracking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
