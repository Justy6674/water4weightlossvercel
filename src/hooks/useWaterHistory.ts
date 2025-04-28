import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WaterLogEntry } from '@/components/water/WaterHistory';

export const useWaterHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<WaterLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('water_tracker')
          .select('daily_logs')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error loading water history:', fetchError);
          setError('Failed to load water history');
          return;
        }

        if (data?.daily_logs) {
          const historyData = Object.values(data.daily_logs);
          // Sort by date in descending order (newest first)
          historyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setHistory(historyData);
        }
      } catch (err) {
        console.error('Error in loadHistory:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const addHistoryEntry = async (entry: WaterLogEntry) => {
    if (!user?.id) return;

    try {
      setError(null);

      // Get current daily_logs first
      const { data: currentData, error: fetchError } = await supabase
        .from('water_tracker')
        .select('daily_logs')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching current history:', fetchError);
        setError('Failed to update water history');
        return;
      }

      const currentLogs = currentData?.daily_logs || {};
      const updatedLogs = {
        ...currentLogs,
        [entry.date]: entry,
      };

      const { error: updateError } = await supabase
        .from('water_tracker')
        .upsert({
          user_id: user.id,
          daily_logs: updatedLogs,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error updating water history:', updateError);
        setError('Failed to update water history');
        return;
      }

      setHistory(prev => {
        const updated = [...prev.filter(e => e.date !== entry.date), entry];
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    } catch (err) {
      console.error('Error in addHistoryEntry:', err);
      setError('An unexpected error occurred');
    }
  };

  return {
    history,
    addHistoryEntry,
    isLoading,
    error,
  };
}; 