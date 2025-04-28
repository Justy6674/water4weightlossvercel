import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WaterRing } from "./WaterRing";
import { LevelBadge } from "./LevelBadge";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { OtherHydrationOptions } from "./OtherHydrationOptions";
import { ReminderSystem } from "./ReminderSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle"; // <-- Theme switch
import { 
  Droplet, 
  CupSoda, 
  GlassWater, 
  Plus, 
  Trophy 
} from "lucide-react";
import { useToast } from '@/components/ui/use-toast';
import { useHydration } from "@/contexts/HydrationContext";
import { useHydrationMessages } from "@/hooks/useHydrationMessages";

export function WaterTracker() {
  const { user } = useAuth();
  const { dailyGoal, currentAmount, addWater } = useHydration();
  const { sendMessage, sendAchievementMessage } = useHydrationMessages();
  const { toast } = useToast();

  const [customAmount, setCustomAmount] = useState("");
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isOtherHydrationOpen, setIsOtherHydrationOpen] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);

  const percentage = dailyGoal > 0 ? Math.min(100, (currentAmount / dailyGoal) * 100) : 0;
  const amountToGo = Math.max(0, dailyGoal - currentAmount);

  useEffect(() => {
    if (previousPercentage < 100 && percentage >= 100) {
      setShowVictoryAnimation(true);
      setShowConfetti(true);
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }
    setPreviousPercentage(percentage);
  }, [percentage, previousPercentage]);

  const quickAddOptions = [
    { name: "Sip", amount: 50, icon: <Droplet className="h-5 w-5" /> },
    { name: "Small Glass", amount: 150, icon: <CupSoda className="h-5 w-5" /> },
    { name: "Large Glass", amount: 250, icon: <GlassWater className="h-5 w-5" /> },
    { name: "Water Bottle", amount: 600, icon: <Droplet className="h-5 w-5" /> },
  ];

  const handleQuickAdd = async (amount: number, label?: string) => {
    const prevPercentage = (currentAmount / dailyGoal) * 100;
    await addWater(amount);

    const newPercentage = (currentAmount + amount) / dailyGoal * 100;

    if (prevPercentage < 25 && newPercentage >= 25) {
      sendMessage("🎉 25% of your daily goal reached! Keep going!", "achievement");
      setShowConfetti(true);
    }
    if (prevPercentage < 50 && newPercentage >= 50) {
      sendMessage("🎉 50% reached! Halfway to your goal!", "achievement");
      setShowConfetti(true);
    }
    if (prevPercentage < 75 && newPercentage >= 75) {
      sendMessage("🎉 75% done! Almost there!", "achievement");
      setShowConfetti(true);
    }
    if (prevPercentage < 100 && newPercentage >= 100) {
      sendAchievementMessage("🎊 100%! You hit your hydration goal! 🌊");
      setShowVictoryAnimation(true);
      setShowConfetti(true);
      setTimeout(() => setShowVictoryAnimation(false), 3000);
    }

    toast({
      title: "Water Added",
      description: label ? `Added ${label}` : `Added ${amount}ml of water!`,
      duration: 2000,
    });
  };

  const handleCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleQuickAdd(amount);
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

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setIsOtherHydrationOpen(true)}>
          Other Drinks
        </Button>
        <ThemeToggle />
      </div>

      {isOtherHydrationOpen && (
        <OtherHydrationOptions
          onAddHydration={(amount, label) => {
            handleQuickAdd(amount, label);
            setIsOtherHydrationOpen(false);
          }}
        />
      )}

      <Card className="relative overflow-hidden bg-white/5 border border-downscale-brown/20">
        {showVictoryAnimation && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10 animate-fade-in">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold text-downscale-cream mb-2">GOAL ACHIEVED!</h2>
              <p className="text-downscale-cream/80">Amazing effort today! 🎉</p>
            </div>
          </div>
        )}

        <CardContent className="flex flex-col items-center pt-6">
          <div className="flex flex-col items-center justify-center w-full max-w-md">
            <div className="mb-4">
              <LevelBadge streak={0} percentage={percentage} />
            </div>

            <WaterRing percentage={percentage} size={250} showAnimation={true} />

            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-downscale-cream">
                {amountToGo > 0 
                  ? `${amountToGo >= 1000 ? `${(amountToGo / 1000).toFixed(1)}L` : `${amountToGo}ml`} to go`
                  : "Goal completed! 🎉"}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              {quickAddOptions.map(option => (
                <Button key={option.name} onClick={() => handleQuickAdd(option.amount, option.name)}>
                  {option.icon} {option.name}
                </Button>
              ))}
              <Button onClick={toggleCustomInput}>
                <Plus className="h-5 w-5" /> Custom
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
