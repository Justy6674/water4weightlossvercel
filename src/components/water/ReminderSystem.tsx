import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHydrationMessages } from '@/hooks/useHydrationMessages';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ReminderSystemProps {
  userId: string;
}

export function ReminderSystem({ userId }: ReminderSystemProps) {
  const { sendMessage } = useHydrationMessages();
  const { userProfile, refreshUserProfile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initializeReminders = async () => {
      if (!userId) return;
      
      try {
        // Make sure we have the latest user profile data
        await refreshUserProfile();
        
        // Verify reminder settings in Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('reminders_enabled, reminder_method, phone_number, email')
          .eq('user_id', userId)
          .single();
        
        if (profileError) {
          console.error('Error fetching reminder settings:', profileError);
          return;
        }
        
        // If profile data exists but reminder settings are missing, initialize them
        if (profileData && !profileData.reminders_enabled && !profileData.reminder_method) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              reminders_enabled: false,
              reminder_method: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error initializing reminder settings:', updateError);
          }
        }
        
        setIsInitialized(true);
        
        console.log('Reminder system initialized:', {
          userId,
          remindersEnabled: userProfile?.reminders_enabled,
          method: userProfile?.reminder_method || 'not set',
          phoneValid: !!userProfile?.phone_number && userProfile?.phone_number.startsWith('+'),
          emailValid: !!userProfile?.email && userProfile?.email.includes('@')
        });
      } catch (err) {
        console.error('Error in ReminderSystem initialization:', err);
      }
    };
    
    initializeReminders();
  }, [userId, refreshUserProfile]);
  
  useEffect(() => {
    if (!isInitialized || !userId || !userProfile) return;
    
    const handleHydrationEvent = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      
      console.log('Received hydration message event:', {
        type: detail?.type,
        text: detail?.text,
        remindersEnabled: userProfile?.reminders_enabled,
        reminderMethod: userProfile?.reminder_method
      });
      
      if ((detail?.type === 'reminder' || detail?.type === 'achievement') && userProfile?.reminders_enabled) {
        try {
          const userName = userProfile?.display_name || 'Hydration Champion';
          const milestoneType = detail.type === 'achievement' ? 'goal completion' : detail.text;

          let finalMessage = detail.text;
          try {
            const { data: personalizedData, error: personalizationError } = await supabase.functions.invoke('generate-personalized-message', {
              body: { userName, milestoneType }
            });

            if (personalizationError) {
              console.error('Error generating personalized message:', personalizationError);
              finalMessage = getFallbackMessage(userName, milestoneType);
              console.log('Gemini personalization failed, using fallback.');
            } else {
              finalMessage = personalizedData?.personalizedMessage || getFallbackMessage(userName, milestoneType);
              console.log('Gemini generated message:', finalMessage);
            }
          } catch (geminiError) {
            console.error('Gemini API error:', geminiError);
            finalMessage = getFallbackMessage(userName, milestoneType);
            console.log('Gemini personalization failed, using fallback.');
          }
          
          if (!userProfile?.reminders_enabled) {
            console.log('External notifications disabled');
            return;
          }

          if ((userProfile?.reminder_method === 'sms' || userProfile?.reminder_method === 'whatsapp') && userProfile?.phone_number) {
            try {
              const response = await supabase.functions.invoke('send-hydration-reminder', {
                body: { 
                  phone: userProfile.phone_number,
                  message: finalMessage,
                  method: userProfile.reminder_method
                }
              });
              
              if (response.error) {
                throw new Error(response.error.message);
              }
              
              console.log(`Reminder sent successfully via ${userProfile.reminder_method}`);
            } catch (primaryError) {
              console.error(`Error sending ${userProfile.reminder_method} reminder:`, primaryError);
              
              if (userProfile.reminder_method === 'sms' && userProfile.phone_number) {
                try {
                  console.log('SMS sending failed, attempting WhatsApp fallback.');
                  const whatsappResponse = await supabase.functions.invoke('send-hydration-reminder', {
                    body: { 
                      phone: userProfile.phone_number,
                      message: finalMessage,
                      method: 'whatsapp'
                    }
                  });
                  
                  if (whatsappResponse.error) {
                    throw new Error(whatsappResponse.error.message);
                  }
                  
                  console.log('WhatsApp fallback successful');
                } catch (whatsappError) {
                  console.error('WhatsApp fallback failed:', whatsappError);
                  
                  if (userProfile.email) {
                    try {
                      console.log('WhatsApp sending failed, attempting email fallback.');
                      const emailResponse = await supabase.functions.invoke('send-hydration-reminder', {
                        body: { 
                          email: userProfile.email,
                          message: finalMessage,
                          method: 'email'
                        }
                      });
                      
                      if (emailResponse.error) {
                        throw new Error(emailResponse.error.message);
                      }
                      
                      console.log('Email fallback successful');
                    } catch (emailError) {
                      console.error('Email fallback failed:', emailError);
                      console.log('All reminder channels failed.');
                      throw emailError;
                    }
                  } else {
                    console.log('No email available for fallback. All reminder channels failed.');
                    throw whatsappError;
                  }
                }
              } else if (userProfile.email) {
                try {
                  console.log('Primary method failed, attempting email fallback.');
                  const emailResponse = await supabase.functions.invoke('send-hydration-reminder', {
                    body: { 
                      email: userProfile.email,
                      message: finalMessage,
                      method: 'email'
                    }
                  });
                  
                  if (emailResponse.error) {
                    throw new Error(emailResponse.error.message);
                  }
                  
                  console.log('Email reminder sent successfully');
                } catch (emailError) {
                  console.error('Email reminder failed:', emailError);
                  console.log('All reminder channels failed.');
                  throw emailError;
                }
              }
            }
          } else if (userProfile?.reminder_method === 'email' && userProfile?.email) {
            try {
              const emailResponse = await supabase.functions.invoke('send-hydration-reminder', {
                body: { 
                  email: userProfile.email,
                  message: finalMessage,
                  method: 'email'
                }
              });
              
              if (emailResponse.error) {
                throw new Error(emailResponse.error.message);
              }
              
              console.log('Email reminder sent successfully');
            } catch (emailError) {
              console.error('Email reminder failed:', emailError);
              console.log('All reminder channels failed.');
              throw emailError;
            }
          }
        } catch (err) {
          console.error('Error in hydration event handler:', err);
          toast.error('Unable to send reminder notification');
        }
      }
    };
    
    window.addEventListener('hydration-message', handleHydrationEvent);
    
    return () => {
      window.removeEventListener('hydration-message', handleHydrationEvent);
    };
  }, [isInitialized, sendMessage, userId, userProfile]);
  
  const getFallbackMessage = (name: string, milestone: string): string => {
    if (milestone.includes('25%')) {
      return `${name}, you're 25% of the way to your hydration goal! Keep it up!`;
    } else if (milestone.includes('50%')) {
      return `${name}, halfway there! You've reached 50% of your daily water goal.`;
    } else if (milestone.includes('75%')) {
      return `${name}, you're 75% done! Almost at your daily hydration goal!`;
    } else if (milestone.includes('100%') || milestone.includes('goal completion')) {
      return `Great job ${name}! You've completed your daily hydration goal!`;
    } else {
      return `${name}, remember to stay hydrated throughout your day!`;
    }
  };
  
  return null;
}
