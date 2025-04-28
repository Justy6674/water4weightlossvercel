import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useExternalNotifications = () => {
  const { user, userProfile } = useAuth();

  const sendExternalNotification = async (message: string, userEmail?: string) => {
    if (!user || !userProfile) {
      console.log('No user authenticated or profile loaded, skipping notification');
      return;
    }

    try {
      console.log('Checking delivery options:', {
        method: userProfile.reminder_method,
        phoneProvided: !!userProfile.phone_number,
        emailProvided: !!userProfile.email,
        enabled: userProfile.reminders_enabled
      });
      
      if (!userProfile.reminders_enabled) {
        console.log('External notifications disabled');
        return;
      }
      
      // Try primary notification method
      if ((userProfile.reminder_method === 'sms' || userProfile.reminder_method === 'whatsapp') && userProfile.phone_number) {
        try {
          const response = await supabase.functions.invoke('send-hydration-reminder', {
            body: { 
              phone: userProfile.phone_number,
              message,
              method: userProfile.reminder_method
            }
          });
          
          console.log(`${userProfile.reminder_method} reminder response:`, response);
          if (response.error) {
            console.error(`Error sending ${userProfile.reminder_method} reminder:`, response.error);
          }
          
          if (!response.error) {
            console.log(`${userProfile.reminder_method} reminder sent successfully`);
            return;
          }
          
          // Try fallback methods if primary fails
          if (userProfile.reminder_method === 'sms') {
            await tryWhatsAppFallback(userProfile.phone_number, message, userProfile.email || userEmail);
          } else {
            await tryEmailFallback(userProfile.email || userEmail, message);
          }
        } catch (e) {
          console.error(`Failed to send ${userProfile.reminder_method} reminder:`, e);
          await tryEmailFallback(userProfile.email || userEmail, message);
        }
      } 
      else if (userProfile.reminder_method === 'email' && (userProfile.email || userEmail)) {
        await tryEmailFallback(userProfile.email || userEmail, message);
      }
      else {
        console.log('No valid notification method available. reminder_method:', userProfile.reminder_method);
      }
    } catch (e) {
      console.error('Error in sendExternalNotification:', e);
    }
  };

  const tryWhatsAppFallback = async (phone: string, message: string, email?: string) => {
    try {
      console.log('SMS sending failed, attempting WhatsApp as fallback');
      const whatsappResponse = await supabase.functions.invoke('send-hydration-reminder', {
        body: { 
          phone,
          message,
          method: 'whatsapp'
        }
      });
      
      if (whatsappResponse.error) {
        console.error('WhatsApp fallback failed:', whatsappResponse.error);
        await tryEmailFallback(email, message);
      } else {
        console.log('WhatsApp fallback successful');
      }
    } catch (whatsAppError) {
      console.error('WhatsApp fallback attempt failed:', whatsAppError);
      await tryEmailFallback(email, message);
    }
  };

  const tryEmailFallback = async (email: string | undefined, message: string) => {
    if (!email) {
      console.log('No email available for fallback');
      return;
    }

    try {
      console.log('Attempting email delivery to:', email);
      const response = await supabase.functions.invoke('send-hydration-reminder', {
        body: { 
          email,
          message,
          method: 'email'
        }
      });
      
      if (response.error) {
        console.error('Email delivery error:', response.error);
      } else {
        console.log('Email reminder sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send email reminder:', emailError);
    }
  };

  return { sendExternalNotification };
};
