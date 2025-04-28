
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-downscale-slate p-4">
      <div className="text-center space-y-6 max-w-md">
        <img 
          src="/lovable-uploads/9e2a3c9a-32e4-46b4-8d14-98cad79cfcd5.png" 
          alt="Water-4-WeightLoss by Downscale" 
          className="h-16 mx-auto"
        />
        <h1 className="text-4xl font-bold text-downscale-brown">404</h1>
        <p className="text-xl text-downscale-cream mb-4">Oops! Page not found</p>
        <p className="text-downscale-cream/70 mb-6">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button 
          className="bg-downscale-blue hover:bg-downscale-blue/90 text-white"
          asChild
        >
          <a href="/">Return to Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
