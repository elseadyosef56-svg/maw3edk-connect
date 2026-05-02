import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Overview from "./pages/dashboard/Overview";
import Services from "./pages/dashboard/Services";
import Employees from "./pages/dashboard/Employees";
import CalendarPage from "./pages/dashboard/CalendarPage";
import SettingsPage from "./pages/dashboard/Settings";
import Billing from "./pages/dashboard/Billing";
import Promotions from "./pages/dashboard/Promotions";
import PublicBooking from "./pages/PublicBooking";
import CheckIn from "./pages/CheckIn";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminPanel from "./pages/admin/AdminPanel";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/checkin/:token" element={<CheckIn />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="services" element={<Services />} />
                <Route path="employees" element={<Employees />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="billing" element={<Billing />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/:slug" element={<PublicBooking />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
