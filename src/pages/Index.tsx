import { useEffect } from "react";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();

  // Show loading state until authentication is initialized
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-downscale-slate">
        <p className="text-downscale-cream">Loading authentication...</p>
      </div>
    );
  }

  // If we're on the login page, show AuthPage regardless of user state
  if (location.pathname === '/login') {
    return <AuthPage onLogin={() => {}} />;
  }
  
  // Otherwise, show Dashboard if user is logged in
  return user ? <Dashboard onLogout={signOut} /> : <AuthPage onLogin={() => {}} />;
};

export default Index;
