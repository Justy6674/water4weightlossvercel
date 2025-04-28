import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WaterRing } from "./WaterRing";
import { WaterHistory, WaterLogEntry } from "./WaterHistory";
import { useHydration } from "@/contexts/HydrationContext";
import { LevelBadge } from "./LevelBadge";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trophy,
  Droplet, 
  GlassWater, 
  CupSoda
} from "lucide-react";
import { useToast } from '@/components/ui/use-toast'
import { OtherHydrationOptions } from "./OtherHydrationOptions";
import { ReminderSystem } from "./ReminderSystem";
import { useHydrationMessages } from "@/hooks/useHydrationMessages";

export function WaterTracker() {
  const { user } = useAuth();
  const { dailyGoal, currentAmount, addWater } = useHydration();
  const { sendMessage, sendAchievementMessage } = useHydrationMessages();
  const { toast } = useToast();
  
  const [customAmount, setCustomAmount] = useState("");
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [amountToGo, setAmountToGo] = useState(dailyGoal);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isOtherHydrationOpen, setIsOtherHydrationOpen] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);
  
  const percentage = dailyGoal > 0 ? Math.min(100, (currentAmount / dailyGoal) * 100) : 0;
  
  useEffect(() => {
    setAmountToGo(Math.max(0, dailyGoal - currentAmount));
    
    if (previousPercentage < 100 && percentage >= 100) {
      setShowVictoryAnimation(true);
      setShowConfetti(true);
      
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }
    
    setPreviousPercentage(percentage);
  }, [currentAmount, dailyGoal, percentage, previousPercentage]);
  
  const quickAddOptions = [
    { name: "Sip", amount: 50, icon: <Droplet className="h-5 w-5" /> },
    { name: "Small Glass", amount: 150, icon: <CupSoda className="h-5 w-5" /> },
    { name: "Large Glass", amount: 250, icon: <GlassWater className="h-5 w-5" /> },
    { name: "Water Bottle", amount: 600, icon: <Droplet className="h-5 w-5" /> },
  ];

  const handleQuickAdd = async (amount: number, label?: string) => {
    await addWater(amount);

    toast({
      title: "Water Added",
      description: label ? `Added ${label} (${amount}ml)` : `Added ${amount}ml!`,
      duration: 2000
    });

    if (percentage >= 100) {
      setShowVictoryAnimation(true);
      setShowConfetti(true);
      sendAchievementMessage("🎊 Goal Achieved! Amazing hydration today!");
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }
  };

  const handleCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleQuickAdd(amount, "Custom Amount");
      setCustomAmount("");
      setShowCustomInput(false);
    }
  };

  const toggleCustomInput = () => {
    setShowCustomInput(!showCustomInput);
    if (!showCustomInput) {
      setTimeout(() => {
        document.getElementById('custom-amount')?.focus();
      }, 100);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {user && <ReminderSystem userId={user.id} />}
      
      <Card className="bg-white/5 border-downscale-brown/20 relative overflow-hidden">
        {showVictoryAnimation && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-yellow-300 mx-auto mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold text-downscale-cream mb-2">GOAL ACHIEVED!</h2>
              <p className="text-downscale-cream/80">Great job staying hydrated today!</p>
            </div>
          </div>
        )}
        
        <CardContent className="flex flex-col items-center pt-6">
          <div className="flex flex-col items-center justify-center w-full max-w-md">
            <WaterRing percentage={percentage} size={250} showAnimation={true} />
            
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-downscale-cream">
                {amountToGo > 0 
                  ? `${amountToGo >= 1000 ? `${(amountToGo/1000).toFixed(1)}L` : `${amountToGo}ml`} to go` 
                  : "Goal completed! 🎉"}
              </p>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4">
              {quickAddOptions.map(option => (
                <Button key={option.name} onClick={() => handleQuickAdd(option.amount, option.name)}>
                  {option.icon} {option.name}
                </Button>
              ))}
              <Button onClick={toggleCustomInput}>
                <Plus className="h-5 w-5" /> Custom
              </Button>
              <Button variant="outline" onClick={() => setIsOtherHydrationOpen(true)}>
                <Waves className="h-5 w-5" /> Other Drinks
              </Button>
            </div>
            {showCustomInput && (
              <div className="mt-4 flex items-center gap-2">
                <Input
                  id="custom-amount"
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Enter amount (ml)"
                  className="w-32"
                />
                <Button onClick={handleCustomAmount}>Add</Button>
              </div>
            )}
            {isOtherHydrationOpen && (
              <OtherHydrationOptions
                onAddHydration={(amount, warning) => {
                  handleQuickAdd(amount, "Other Drink");
                  if (warning) {
                    toast({
                      title: "Heads Up",
                      description: warning,
                      variant: "warning",
                      duration: 4000,
                    });
                  }
                  setIsOtherHydrationOpen(false);
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
