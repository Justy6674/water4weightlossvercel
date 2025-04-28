import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate?: string;
}

const DEFAULT_STREAK: StreakData = {
  current: 0,
  longest: 0,
};

export const useWaterStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadStreakData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('water_tracker')
          .select('streak, daily_logs')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error loading streak data:', fetchError);
          setError('Failed to load streak data');
          return;
        }

        if (data) {
          const dailyLogs = data.daily_logs || {};
          const dates = Object.keys(dailyLogs).sort();
          const lastCompletedDate = dates.length > 0 ? dates[dates.length - 1] : undefined;

          setStreakData({
            current: data.streak || 0,
            longest: data.longest_streak || data.streak || 0,
            lastCompletedDate,
          });
        }
      } catch (err) {
        console.error('Error in loadStreakData:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadStreakData();
  }, [user?.id]);

  const updateStreak = async (completed: boolean) => {
    if (!user?.id) return;

    try {
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      let newStreak = streakData.current;
      let longestStreak = streakData.longest;

      if (completed) {
        // Check if the last completed date was yesterday
        const lastDate = streakData.lastCompletedDate;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
          newStreak += 1;
          longestStreak = Math.max(longestStreak, newStreak);
        } else if (lastDate !== today) {
          // If we missed a day or this is the first completion
          newStreak = 1;
        }
      } else {
        // Reset streak if we failed to complete
        newStreak = 0;
      }

      const { error: updateError } = await supabase
        .from('water_tracker')
        .upsert({
          user_id: user.id,
          streak: newStreak,
          longest_streak: longestStreak,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error updating streak:', updateError);
        setError('Failed to update streak');
        return;
      }

      setStreakData(prev => ({
        ...prev,
        current: newStreak,
        longest: longestStreak,
        lastCompletedDate: completed ? today : prev.lastCompletedDate,
      }));
    } catch (err) {
      console.error('Error in updateStreak:', err);
      setError('An unexpected error occurred');
    }
  };

  return {
    streakData,
    updateStreak,
    isLoading,
    error,
  };
}; 