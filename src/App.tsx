
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HDMFLoanEntry from "./pages/HDMFLoanEntry";
import SSSLoanEntry from "./pages/SSSLoanEntry";
import SSSEmergencyLoanEntry from "./pages/SSSEmergencyLoanEntry";
import SSSCalamityLoanEntry from "./pages/SSSCalamityLoanEntry";
import SearchLoan from "./pages/SearchLoan";
import PaymentScheduler from "./pages/PaymentScheduler";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { initializeStorage } from "./utils/storage";
import Plasma from "./components/Plasma";
import SplashScreen from "./components/SplashScreen";

const Reports = lazy(() => import("./pages/Reports"));
const BackupRestore = lazy(() => import("./pages/BackupRestore"));

const queryClient = new QueryClient();

const SPLASH_KEY = "jhaymarts_splash_shown";

const App = () => {
  const [showSplash, setShowSplash] = useState(
    () => sessionStorage.getItem(SPLASH_KEY) !== "1"
  );

  useEffect(() => {
    // Preload / initialize storage while the splash screen plays
    initializeStorage();
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Plasma
          color="#97cfa1"
          speed={1.1}
          direction="forward"
          scale={1}
          opacity={1}
          mouseInteractive={false}
          renderScale={0.55}
          maxDpr={1.5}
          targetFps={60}
          iterations={60}
        />
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="p-8 text-center text-white">Loading…</div>}>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/hdmf-loan" element={<HDMFLoanEntry />} />
                <Route path="/sss-loan" element={<SSSLoanEntry />} />
                <Route path="/sss-emergency-loan" element={<SSSEmergencyLoanEntry />} />
                <Route path="/sss-calamity-loan" element={<SSSCalamityLoanEntry />} />
                <Route path="/search" element={<SearchLoan />} />
                <Route path="/payment-scheduler" element={<PaymentScheduler />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/backup" element={<BackupRestore />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
