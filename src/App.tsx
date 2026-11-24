import { lazy, Suspense } from "react";
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
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Services = lazy(() => import("./pages/dashboard/Services"));
const Employees = lazy(() => import("./pages/dashboard/Employees"));
const CalendarPage = lazy(() => import("./pages/dashboard/CalendarPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/Settings"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const Promotions = lazy(() => import("./pages/dashboard/Promotions"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <Suspense fallback={<div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
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
            </Suspense>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
