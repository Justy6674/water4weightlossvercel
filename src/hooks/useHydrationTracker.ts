import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHydrationMessages } from './useHydrationMessages';
import { useToast } from '@/components/ui/use-toast';

export function useHydrationTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleHydrationMilestone } = useHydrationMessages();
  
  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000); // Default goal in ml
  const [milestonesReached, setMilestonesReached] = useState<Record<number, boolean>>({
    25: false,
    50: false,
    75: false,
    100: false,
  });
  
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('hydration_tracker')
        .select('current_intake, daily_goal, milestones_reached')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setCurrentIntake(data.current_intake);
        setDailyGoal(data.daily_goal);
        setMilestonesReached(data.milestones_reached || {
          25: false,
          50: false,
          75: false,
          100: false,
        });
      }
    } catch (err) {
      console.error("Failed to load hydration data:", err);
    }
  }, [user]);
  
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);
  
  const addIntake = useCallback(async (amount: number) => {
    if (!user?.id) return;
    
    try {
      const newIntake = currentIntake + amount;
      const percentage = Math.round((newIntake / dailyGoal) * 100);
      
      // Check for milestones
      const newMilestones = { ...milestonesReached };
      let milestoneReached = false;
      
      if (percentage >= 25 && !milestonesReached[25]) {
        await handleHydrationMilestone(25);
        newMilestones[25] = true;
        milestoneReached = true;
      }
      if (percentage >= 50 && !milestonesReached[50]) {
        await handleHydrationMilestone(50);
        newMilestones[50] = true;
        milestoneReached = true;
      }
      if (percentage >= 75 && !milestonesReached[75]) {
        await handleHydrationMilestone(75);
        newMilestones[75] = true;
        milestoneReached = true;
      }
      if (percentage >= 100 && !milestonesReached[100]) {
        await handleHydrationMilestone(100);
        newMilestones[100] = true;
        milestoneReached = true;
      }
      
      if (milestoneReached) {
        setMilestonesReached(newMilestones);
      }
      
      const { error } = await supabase
        .from('hydration_tracker')
        .upsert({
          user_id: user.id,
          current_intake: newIntake,
          daily_goal: dailyGoal,
          milestones_reached: newMilestones,
        });
        
      if (error) throw error;
      
      setCurrentIntake(newIntake);
    } catch (err) {
      console.error("Failed to update hydration data:", err);
      toast({
        title: "Error",
        description: "Failed to update hydration data.",
        variant: "destructive",
      });
    }
  }, [user, currentIntake, dailyGoal, milestonesReached, handleHydrationMilestone, toast]);
  
  const resetDailyIntake = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('hydration_tracker')
        .upsert({
          user_id: user.id,
          current_intake: 0,
          daily_goal: dailyGoal,
          milestones_reached: {
            25: false,
            50: false,
            75: false,
            100: false,
          },
        });
        
      if (error) throw error;
      
      setCurrentIntake(0);
      setMilestonesReached({
        25: false,
        50: false,
        75: false,
        100: false,
      });
    } catch (err) {
      console.error("Failed to reset hydration data:", err);
      toast({
        title: "Error",
        description: "Failed to reset hydration data.",
        variant: "destructive",
      });
    }
  }, [user, dailyGoal, toast]);
  
  return {
    currentIntake,
    dailyGoal,
    setDailyGoal,
    addIntake,
    resetDailyIntake,
    milestonesReached,
  };
} 