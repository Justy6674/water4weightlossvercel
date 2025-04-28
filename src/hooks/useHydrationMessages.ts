import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileTypeFix } from './useProfileTypeFix';
import { useExternalNotifications } from './useExternalNotifications';
import { Message, MessageType } from '@/types/message.types';
import { getFallbackMessage, formatTimestamp } from '@/utils/messageUtils';
import { useToast } from '@/components/ui/use-toast';

interface HydrationMessage {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
}

const MILESTONE_MESSAGES = {
  25: {
    messages: [
      "You're off to a great start — keep sipping!",
      "Solid first step — stay refreshed!",
      "Momentum looks good — keep going!",
      "First milestone down — nice work!",
      "Your body's thanking you already!",
      "Fueling up for a great day — awesome!",
      "The journey to full hydration starts strong!",
      "Way to kick things off — keep it flowing!",
      "Hydration journey activated — you're doing great!",
      "Water in, worries out — nice beginning!",
    ],
    type: 'reminder' as const,
  },
  50: {
    messages: [
      "Halfway there — amazing effort!",
      "You're crushing the midway mark!",
      "Half the goal, double the pride!",
      "Momentum is powerful — keep sipping!",
      "Hydration is progress — you're nailing it!",
      "Awesome halfway point reached — onwards!",
      "Your energy is building — keep fueling!",
      "Hydration halfway — powerhouse mode engaged!",
      "Strong, steady, halfway hydrated — impressive!",
      "Sip by sip, you're unstoppable!",
    ],
    type: 'reminder' as const,
  },
  75: {
    messages: [
      "You're 75% there — almost finished strong!",
      "This is hydration mastery in progress!",
      "One final stretch — you've got this!",
      "Just a few more sips — power through!",
      "Hydration hero — closing in!",
      "Massive effort — nearly complete!",
      "Your body's loving the hydration boost!",
      "Almost full hydration — you're killing it!",
      "Incredible progress — don't stop now!",
      "One big push — hydration glory awaits!",
    ],
    type: 'achievement' as const,
  },
  100: {
    messages: [
      "Goal achieved — epic hydration today!",
      "You did it — hydration champion!",
      "Top hydration performance — be proud!",
      "Every sip mattered — well done!",
      "Energy recharged — body and mind!",
      "Hydration complete — wellness unlocked!",
      "Mission accomplished — stay proud!",
      "Full hydration — maximum energy mode!",
      "You're a hydration powerhouse!",
      "Goal smashed — hydration elite status!",
    ],
    type: 'achievement' as const,
  },
};

export function useHydrationMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fixProfileData } = useProfileTypeFix();
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendExternalNotification } = useExternalNotifications();
  
  const getRandomMessage = useCallback((milestone: number) => {
    const milestoneData = MILESTONE_MESSAGES[milestone as keyof typeof MILESTONE_MESSAGES];
    if (!milestoneData) return null;
    const randomIndex = Math.floor(Math.random() * milestoneData.messages.length);
    return {
      text: milestoneData.messages[randomIndex],
      type: milestoneData.type,
    };
  }, []);

  const insertNotification = useCallback(async (newMessage: HydrationMessage) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            notification_type: newMessage.title,
            message: newMessage.body,
            sent_at: new Date().toISOString(),
          }
        ]);
        
      if (error) {
        console.error("Failed to insert hydration milestone notification:", error.message);
        toast({
          title: "Error",
          description: "Failed to save hydration reminder.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Unexpected error inserting notification:", err);
    }
  }, [user, toast]);

  const handleHydrationMilestone = useCallback(async (milestone: number) => {
    if (!user?.id) return;
    
    const messageData = getRandomMessage(milestone);
    if (!messageData) return;
    
    const newMessage: HydrationMessage = {
      id: crypto.randomUUID(),
      title: messageData.type,
      body: messageData.text,
      sentAt: new Date().toISOString(),
      read: false,
    };
    
    await insertNotification(newMessage);
  }, [user, getRandomMessage, insertNotification]);
  
  const addMessage = useCallback(async (text: string, type: MessageType = 'info') => {
    if (!user?.id) return null;
    
    const newMessage: Message = {
      id: '', // Will be set by Supabase
      title: type,
      body: text,
      sentAt: new Date().toISOString(),
      read: false,
    };
    
    const messageId = await insertNotification(newMessage);
    if (!messageId) return null;
    
    newMessage.id = messageId.toString();
    setMessages(prev => [...prev.slice(-19), newMessage]);
    return messageId;
  }, [user, toast]);
  
  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        console.error("Failed to mark notification as read:", error.message);
        return;
      }
      
      setMessages(prev =>
        prev.map(msg => (msg.id === id ? { ...msg, read: true } : msg))
      );
    } catch (err) {
      console.error("Unexpected error marking notification as read:", err);
    }
  }, [user]);
  
  const clearMessages = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Failed to clear notifications:", error.message);
        return;
      }
      
      setMessages([]);
    } catch (err) {
      console.error("Unexpected error clearing notifications:", err);
    }
  }, [user]);
  
  const sendMessage = useCallback(async (text: string, type: MessageType = 'info') => {
    if (!user?.id) return null;
    
    try {
      const profileResult = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: profileData } = fixProfileData(profileResult);
      const userName = profileData?.display_name || user.email?.split('@')[0] || 'Hydration Champion';
      const userEmail = profileData?.email || user.email;
      const milestoneType = type === 'achievement' ? 'goal completion' : text;

      let finalMessage = text;
      try {
        console.log('Calling Gemini personalization for:', { userName, milestoneType });
        const { data: personalizedData, error: personalizationError } = await supabase.functions.invoke('generate-personalized-message', {
          body: { userName, milestoneType }
        });

        finalMessage = personalizationError ? 
          getFallbackMessage(userName, milestoneType) : 
          personalizedData?.personalizedMessage || getFallbackMessage(userName, milestoneType);
        
        console.log(personalizationError ? 
          'Using fallback message:' : 
          'Gemini generated message:', finalMessage);
      } catch (geminiError) {
        console.error('Error calling Gemini API:', geminiError);
        finalMessage = getFallbackMessage(userName, milestoneType);
      }

      const messageId = await addMessage(finalMessage, type);
      
      if (messageId && (type === 'reminder' || type === 'achievement')) {
        await sendExternalNotification(finalMessage, userEmail);
      }
      
      return messageId;
    } catch (e) {
      console.error('Error in sendMessage:', e);
      return null;
    }
  }, [addMessage, user, sendExternalNotification, fixProfileData]);
  
  const sendTipMessage = useCallback((text: string) => {
    return addMessage(text, 'tip');
  }, [addMessage]);

  const sendAchievementMessage = useCallback(async (text: string) => {
    const messageId = await addMessage(text, 'achievement');
    
    if (messageId) {
      try {
        const audio = new Audio('/achievement-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play prevented:', e));
      } catch (e) {
        console.error('Error playing achievement sound:', e);
      }
    }
    
    return messageId;
  }, [addMessage]);
  
  return {
    messages,
    sendMessage,
    sendTipMessage,
    sendAchievementMessage,
    markAsRead,
    clearMessages,
    formatTimestamp,
    handleHydrationMilestone,
  };
}
