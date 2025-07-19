import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Route modules
import PublicRoutes from "./publicRoutes";
import ProtectedRoutes from "./protectedRoutes";
import ProcurementRoutes from "./procurementRoutes";
import InventoryRoutes from "./inventoryRoutes";
import ManufacturingRoutes from "./manufacturingRoutes";
import SalesRoutes from "./salesRoutes";
import FinancialsRoutes from "./financialsRoutes";
import UserRoutes from "./userRoutes";
import SettingsRoutes from "./settingsRoutes";
import NotFound from "@/pages/NotFound";
import SupabaseAuthTest from "@/pages/SupabaseAuthTest";
import AuthResetTest from "@/pages/AuthResetTest";
import AuthDebugPanel from "@/components/debug/AuthDebugPanel";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-right" />
              {import.meta.env.DEV && <AuthDebugPanel />}
              <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                {PublicRoutes}
                
                {/* Protected Routes */}
                {ProtectedRoutes}
                
                {/* Module Routes */}
                {ProcurementRoutes}
                {InventoryRoutes}
                {ManufacturingRoutes}
                {SalesRoutes}
                {FinancialsRoutes}
                {UserRoutes}
                {SettingsRoutes}
                
                {/* Auth Test Route */}
                <Route path="/auth-test" element={<SupabaseAuthTest />} />
                <Route path="/auth-reset" element={<AuthResetTest />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </Provider>
  );
};

export default AppRoutes;
