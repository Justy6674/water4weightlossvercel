
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { WaterTracker } from "@/components/water/WaterTracker";
import { MessageCenter } from "@/components/water/MessageCenter";
import { ReminderSystem } from "@/components/water/ReminderSystem";
import { useHydrationMessages } from "@/hooks/useHydrationMessages";
import { WaterHistoryView } from "@/components/water/WaterHistoryView";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Mail, Bell } from "lucide-react";
import { toast } from "sonner";
import { ConfettiOverlay } from "@/components/water/ConfettiOverlay";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const { user } = useAuth();
  const { sendTipMessage, sendMessage } = useHydrationMessages();
  const [showHistory, setShowHistory] = useState(false);
  const [showTestOptions, setShowTestOptions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const initialTipSent = useRef(false);
  
  // Send an initial tip message when the dashboard loads
  useEffect(() => {
    if (user && !initialTipSent.current) {
      // Set flag to true to prevent duplicate tips
      initialTipSent.current = true;
      
      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        sendTipMessage("Remember to space your water intake throughout the day for best results!");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, sendTipMessage]);
  
  // Test functions for reminders at different milestones
  const testReminderOptions = [
    { label: "25% Milestone", message: "You've reached 25% of your daily water goal! Keep up the good work!", type: "reminder" },
    { label: "50% Milestone", message: "Halfway there! You've reached 50% of your hydration goal for today.", type: "reminder" },
    { label: "75% Milestone", message: "Almost there! You've reached 75% of your water goal. Just a bit more!", type: "reminder" },
    { label: "Goal Complete", message: "Congratulations! You've met your daily water goal! Your body thanks you!", type: "achievement" }
  ];

  const triggerTestReminder = (message: string, type: "reminder" | "achievement" = "reminder") => {
    sendMessage(message, type);
    
    // Show confetti for achievement messages
    if (type === "achievement") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    
    toast.success("Test notification sent!");
  };
  
  // If no user, show loading (should be handled by Index.tsx)
  if (!user) {
    return <div className="min-h-screen bg-downscale-slate flex items-center justify-center">
      <p className="text-downscale-cream">Loading dashboard...</p>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-downscale-slate text-downscale-cream">
      <Header user={user} onLogout={onLogout} />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold mb-6 text-center text-downscale-cream">Your Daily Hydration</h1>
        <div className="max-w-2xl mx-auto">
          <WaterTracker />
          
          <div className="mt-6">
            <Button
              variant="ghost"
              className="flex items-center justify-center w-full text-downscale-cream border border-downscale-brown/20 hover:bg-downscale-blue/10"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide History
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View History
                </>
              )}
            </Button>
            
            {showHistory && (
              <div className="mt-4">
                <WaterHistoryView />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Celebration confetti overlay */}
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Test reminder dropdown (for development and testing) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-20 right-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="bg-downscale-blue/20 hover:bg-downscale-blue/30 text-downscale-cream flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
              onClick={() => setShowTestOptions(!showTestOptions)}
            >
              <Bell className="h-4 w-4" />
              <span>Test Reminders</span>
              {showTestOptions ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
            
            {showTestOptions && (
              <div className="absolute bottom-full mb-2 right-0 w-48 bg-downscale-slate border border-downscale-brown/20 rounded-md shadow-lg overflow-hidden">
                {testReminderOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-downscale-cream hover:bg-downscale-blue/20 rounded-none border-b border-downscale-brown/10 py-2"
                    onClick={() => triggerTestReminder(option.message, option.type as "reminder" | "achievement")}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Help/Contact link in the footer */}
      <div className="fixed bottom-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          className="bg-downscale-blue/20 hover:bg-downscale-blue/30 text-downscale-cream flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
          onClick={() => window.location.href = "mailto:hello@downscale.com.au"}
        >
          <Mail className="h-4 w-4" />
          <span>Need help?</span>
        </Button>
      </div>
      
      {/* MessageCenter will internally check for user */}
      <MessageCenter />
      {user && <ReminderSystem userId={user.id} />}
    </div>
  );
};

export default Dashboard;
