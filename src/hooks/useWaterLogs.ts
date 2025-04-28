import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WaterTrackerRow } from '@/integrations/supabase/types';

/**
 * Interface for water intake log entries
 */
export interface WaterLogEntry {
  id: string;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for managing water intake logs
 * @returns Object containing water logs state and methods
 */
export const useWaterLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WaterLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load water logs for the current user
   */
  useEffect(() => {
    if (!user?.id) {
      console.error('No user.id provided to useWaterLogs.');
      return;
    }

    const loadLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('water_tracker')
          .select('*')
          .eq('user_id', user.id)
          .order('intake_date', { ascending: false });

        if (fetchError) {
          console.error('Error loading water logs:', fetchError);
          setError('Failed to load water logs');
          return;
        }

        const formattedLogs: WaterLogEntry[] = (data || []).map((log: WaterTrackerRow) => ({
          id: log.id,
          amount: log.intake_amount,
          date: log.intake_date,
          created_at: log.created_at,
          updated_at: log.updated_at,
        }));

        setLogs(formattedLogs);
        console.log('Loaded water logs from Supabase:', formattedLogs);
      } catch (err) {
        console.error('Error in loadLogs (exception):', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [user?.id]);

  /**
   * Add a new water intake log
   * @param amount - Amount of water in ml
   * @param date - Optional date string (defaults to today)
   */
  const addLog = async (amount: number, date?: string, profile?: { user_id: string, water_goal?: number }) => {
    if (!user?.id) {
      console.error('[Hydration Save] No user.id provided to addLog.');
      return;
    }
    if (profile && (!profile.user_id || !profile.water_goal)) {
      console.error('[Hydration Save] Profile incomplete, cannot log hydration:', profile);
      return;
    }
    try {
      setError(null);
      const logDate = date || new Date().toISOString().split('T')[0];
      console.log('[Hydration Save] Adding water log:', { userId: user.id, amount, logDate });

      const { data, error: insertError } = await supabase
        .from('water_tracker')
        .upsert({
          user_id: user.id,
          intake_amount: amount,
          intake_date: logDate,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding water log:', insertError);
        setError('Failed to add water log');
        return;
      }

      if (data) {
        const newLog: WaterLogEntry = {
          id: data.id,
          amount: data.intake_amount,
          date: data.intake_date,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        setLogs(prev => {
          const filtered = prev.filter(log => log.date !== logDate);
          const updated = [newLog, ...filtered].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          console.log('Updated water logs after add:', updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('[Hydration Save] Error in addLog (exception):', err);
      setError('An unexpected error occurred');
    }
  };

  /**
   * Update an existing water intake log
   * @param id - Log ID to update
   * @param amount - New amount in ml
   */
  const updateLog = async (id: string, amount: number) => {
    if (!user?.id) return;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('water_tracker')
        .update({ intake_amount: amount })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating water log:', updateError);
        setError('Failed to update water log');
        return;
      }

      if (data) {
        setLogs(prev => 
          prev.map(log => 
            log.id === id 
              ? {
                  ...log,
                  amount: data.intake_amount,
                  updated_at: data.updated_at,
                }
              : log
          )
        );
      }
    } catch (err) {
      console.error('Error in updateLog:', err);
      setError('An unexpected error occurred');
    }
  };

  /**
   * Delete a water intake log
   * @param id - Log ID to delete
   */
  const deleteLog = async (id: string) => {
    if (!user?.id) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('water_tracker')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting water log:', deleteError);
        setError('Failed to delete water log');
        return;
      }

      setLogs(prev => prev.filter(log => log.id !== id));
    } catch (err) {
      console.error('Error in deleteLog:', err);
      setError('An unexpected error occurred');
    }
  };

  return {
    logs,
    addLog,
    updateLog,
    deleteLog,
    isLoading,
    error,
  };
}; 