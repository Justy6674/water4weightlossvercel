import { useState, useEffect, useRef } from "react";
import { WaterLogEntry } from "@/components/water/WaterHistory";
import { supabase } from "@/integrations/supabase/client";

const DAILY_GOAL = 3000; // 3 liters = 3000ml

interface WaterTrackerData {
  dailyLogs: Record<string, {
    date: string;
    amount: number;
    goal: number;
    completed: boolean;
  }>;
  streak: number;
  completedDays: number;
}

export const useWaterTracker = (userId: string) => {
  // Use refs to prevent hook ordering issues
  const todayRef = useRef(new Date().toISOString().split('T')[0]);
  
  // All state hooks must be called unconditionally
  const [currentAmount, setCurrentAmount] = useState(0);
  const [dailyGoal] = useState(DAILY_GOAL);
  const [streak, setStreak] = useState(0);
  const [completedDays, setCompletedDays] = useState(0);
  const [history, setHistory] = useState<WaterLogEntry[]>([]);
  
  // Initial data load effect
  useEffect(() => {
    if (!userId) {
      console.error('No userId provided to useWaterTracker.');
      return;
    }
    
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('water_tracker')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error("Error loading water tracker data:", error);
          return;
        }
        
        if (data) {
          const trackerData: WaterTrackerData = {
            dailyLogs: data.daily_logs || {},
            streak: data.streak || 0,
            completedDays: data.completed_days || 0,
          };
          
          // Set the current amount for today
          if (trackerData.dailyLogs[todayRef.current]) {
            setCurrentAmount(trackerData.dailyLogs[todayRef.current].amount);
          } else {
            setCurrentAmount(0);
          }
          
          // Set streak and completed days
          setStreak(trackerData.streak);
          setCompletedDays(trackerData.completedDays);
          
          // Set history
          const historyData = Object.values(trackerData.dailyLogs);
          setHistory(historyData);
        }
      } catch (error) {
        console.error("Error loading water tracker data (exception):", error);
      }
    };
    
    loadData();
  }, [userId]);

  // Data save effect
  useEffect(() => {
    if (!userId) {
      console.error('No userId provided to useWaterTracker.');
      return;
    }
    
    const saveData = async () => {
      try {
        const updates = {
          user_id: userId,
          daily_logs: {
            ...(history.length > 0 ? history.reduce((acc, log) => ({
              ...acc,
              [log.date]: log
            }), {}) : {}),
            [todayRef.current]: {
              date: todayRef.current,
              amount: currentAmount,
              goal: dailyGoal,
              completed: currentAmount >= dailyGoal,
            }
          },
          streak,
          completed_days: completedDays,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('water_tracker')
          .upsert(updates, { onConflict: 'user_id' });

        if (error) {
          console.error("Error saving water tracker data:", error);
        } else {
          console.log("Water tracker data saved to Supabase.");
        }
      } catch (error) {
        console.error("Error saving water tracker data (exception):", error);
      }
    };
    
    saveData();
  }, [userId, currentAmount, streak, completedDays, dailyGoal, history]);

  // Handle adding water
  const addWater = async (amount: number, profile?: { user_id: string, water_goal?: number }) => {
    if (!userId) {
      console.error('[Hydration Save] No userId provided to addWater.');
      return;
    }
    if (profile && (!profile.user_id || !profile.water_goal)) {
      console.error('[Hydration Save] Profile incomplete, cannot log hydration:', profile);
      return;
    }
    const newAmount = currentAmount + amount;
    setCurrentAmount(newAmount);
    console.log('[Hydration Save] Adding water:', { userId, amount, newAmount });
    
    // Check if completing goal for the first time today
    if (currentAmount < dailyGoal && newAmount >= dailyGoal) {
      setCompletedDays(prev => prev + 1);
      
      // Check if yesterday was completed to update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      try {
        const { data, error } = await supabase
          .from('water_tracker')
          .select('daily_logs')
          .eq('user_id', userId)
          .single();
        if (error) {
          console.error("Error fetching yesterday's log for streak:", error);
        }
        if (data?.daily_logs?.[yesterdayStr]?.completed) {
          setStreak(prev => prev + 1);
        } else if (!data?.daily_logs?.[todayRef.current]) {
          // If this is the first entry today and yesterday wasn't completed, reset streak
          setStreak(1);
        }
      } catch (err) {
        console.error("Error checking streak (exception):", err);
        setStreak(1);
      }
    }
  };

  return {
    currentAmount,
    dailyGoal,
    streak,
    completedDays,
    history,
    addWater,
  };
};
