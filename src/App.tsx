import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClinicalInfo from "./pages/ClinicalInfo";
import ShopifyRedirect from "./pages/ShopifyRedirect";
import { useAuth } from "./contexts/AuthContext";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-downscale-slate">
        <p className="text-downscale-cream">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <div className="bg-downscale-slate text-downscale-cream">
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Index />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinical-info"
            element={
              <ProtectedRoute>
                <ClinicalInfo />
              </ProtectedRoute>
            }
          />
          <Route path="/shopify" element={<ShopifyRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
      </ThemeProvider>
    </div>
  );
}

export default App;
