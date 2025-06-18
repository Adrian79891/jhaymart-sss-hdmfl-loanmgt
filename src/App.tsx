
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HDMFLoanEntry from "./pages/HDMFLoanEntry";
import SSSLoanEntry from "./pages/SSSLoanEntry";
import SearchLoan from "./pages/SearchLoan";
import PaymentScheduler from "./pages/PaymentScheduler";
import Reports from "./pages/Reports";
import BackupRestore from "./pages/BackupRestore";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { initializeStorage } from "./utils/storage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize storage on app start
    initializeStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/hdmf-loan" element={<HDMFLoanEntry />} />
              <Route path="/sss-loan" element={<SSSLoanEntry />} />
              <Route path="/search" element={<SearchLoan />} />
              <Route path="/payment-scheduler" element={<PaymentScheduler />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/backup" element={<BackupRestore />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
