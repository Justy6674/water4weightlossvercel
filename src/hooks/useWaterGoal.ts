import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_GOAL = 3000; // 3 liters = 3000ml

export const useWaterGoal = () => {
  const { user } = useAuth();
  const [waterGoal, setWaterGoal] = useState(DEFAULT_GOAL);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadWaterGoal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('water_goal')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error loading water goal:', fetchError);
          setError('Failed to load water goal');
          return;
        }

        if (data?.water_goal) {
          setWaterGoal(data.water_goal);
        }
      } catch (err) {
        console.error('Error in loadWaterGoal:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadWaterGoal();
  }, [user?.id]);

  const updateWaterGoal = async (newGoal: number) => {
    if (!user?.id) return;

    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ water_goal: newGoal })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating water goal:', updateError);
        setError('Failed to update water goal');
        return;
      }

      setWaterGoal(newGoal);
    } catch (err) {
      console.error('Error in updateWaterGoal:', err);
      setError('An unexpected error occurred');
    }
  };

  return {
    waterGoal,
    setWaterGoal: updateWaterGoal,
    isLoading,
    error,
  };
}; 