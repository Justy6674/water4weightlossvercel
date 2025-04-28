import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useExternalNotifications } from './useExternalNotifications';

export interface ReminderSettings {
  enabled: boolean;
  method: 'sms' | 'email' | 'whatsapp' | null;
  frequency: number; // minutes
  lastSent?: string; // ISO date string
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  method: null,
  frequency: 120, // 2 hours
};

export const useWaterReminders = () => {
  const { user } = useAuth();
  const { sendExternalNotification } = useExternalNotifications();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('reminders_enabled, reminder_method')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error loading reminder settings:', fetchError);
          setError('Failed to load reminder settings');
          return;
        }

        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            enabled: data.reminders_enabled || false,
            method: data.reminder_method as ReminderSettings['method'],
          });
        }
      } catch (err) {
        console.error('Error in loadSettings:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const updateSettings = async (newSettings: Partial<ReminderSettings>) => {
    if (!user?.id) return;

    try {
      setError(null);

      const updates = {
        reminders_enabled: newSettings.enabled !== undefined ? newSettings.enabled : settings.enabled,
        reminder_method: newSettings.method !== undefined ? newSettings.method : settings.method,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating reminder settings:', updateError);
        setError('Failed to update reminder settings');
        return;
      }

      setSettings(prev => ({
        ...prev,
        ...newSettings,
      }));
    } catch (err) {
      console.error('Error in updateSettings:', err);
      setError('An unexpected error occurred');
    }
  };

  const sendReminder = async (message: string) => {
    if (!settings.enabled || !settings.method) return;

    try {
      await sendExternalNotification(message);
      setSettings(prev => ({
        ...prev,
        lastSent: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error sending reminder:', err);
      setError('Failed to send reminder');
    }
  };

  return {
    settings,
    updateSettings,
    sendReminder,
    isLoading,
    error,
  };
}; 