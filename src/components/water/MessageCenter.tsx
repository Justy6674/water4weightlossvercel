import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Trophy, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrationMessages } from "@/hooks/useHydrationMessages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Message } from "@/types/message.types";

export function MessageCenter({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const actualUserId = userId || user?.id;
  
  const loadNotifications = async () => {
    if (!actualUserId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', actualUserId)
        .order('sent_at', { ascending: false });
        
      if (error) {
        console.error("Failed to load notifications:", error.message);
        toast({
          title: "Error",
          description: "Failed to load notifications. Please try again later.",
          variant: "destructive",
        });
        setMessages([]);
        setUnreadCount(0);
        return;
      }
      
      if (!data || data.length === 0) {
        setMessages([]);
        setUnreadCount(0);
        return;
      }
      
      // Map Supabase records to Message format
      const parsedMessages = data.map((n) => ({
        id: n.id.toString(),
        title: n.notification_type || "Notification",
        body: n.message || "",
        sentAt: n.sent_at,
        read: false,
      }));
      
      setMessages(parsedMessages);
      setUnreadCount(parsedMessages.filter(msg => !msg.read).length);
      
    } catch (err) {
      console.error("Unexpected error loading notifications:", err);
      toast({
        title: "Error",
        description: "Unexpected error loading notifications.",
        variant: "destructive",
      });
      setMessages([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadNotifications();
  }, [actualUserId]);
  
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        console.error("Failed to mark notification as read:", error.message);
        toast({
          title: "Error",
          description: "Failed to mark notification as read.",
          variant: "destructive",
        });
        return;
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, read: true } : msg
      ));
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error("Unexpected error marking notification as read:", err);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', actualUserId)
        .eq('read', false);
        
      if (error) {
        console.error("Failed to mark all notifications as read:", error.message);
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read.",
          variant: "destructive",
        });
        return;
      }
      
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Unexpected error marking all notifications as read:", err);
    }
  };
  
  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Failed to delete notification:", error.message);
        toast({
          title: "Error",
          description: "Failed to delete notification.",
          variant: "destructive",
        });
        return;
      }
      
      setMessages(prev => prev.filter(msg => msg.id !== id));
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error("Unexpected error deleting notification:", err);
    }
  };
  
  const clearAllMessages = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', actualUserId);
        
      if (error) {
        console.error("Failed to clear notifications:", error.message);
        toast({
          title: "Error",
          description: "Failed to clear notifications.",
          variant: "destructive",
        });
        return;
      }
      
      setMessages([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Unexpected error clearing notifications:", err);
    }
  };
  
  const getMessageIcon = (type: string) => {
    switch(type) {
      case "achievement": return <Trophy className="h-5 w-5 text-yellow-300" />;
      case "tip": return <Info className="h-5 w-5 text-blue-400" />;
      case "alert": return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return <MessageSquare className="h-5 w-5 text-downscale-cream" />;
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    
    return `${diffDays}d ago`;
  };
  
  if (!actualUserId) return null;
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-downscale-blue hover:bg-downscale-blue/90 text-white"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        Messages
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
        )}
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 right-4 z-50 w-80 max-h-96 overflow-hidden rounded-lg shadow-lg"
          >
            <Card className="bg-downscale-slate border-downscale-brown/20">
              <div className="p-3 flex items-center justify-between bg-downscale-blue/30">
                <h3 className="text-sm font-medium text-downscale-cream flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Hydration Messages
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead} 
                      className="h-7 px-2 text-xs text-downscale-cream/80"
                    >
                      Read all
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)} 
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-80 p-2 space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-downscale-cream/60 text-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-downscale-cream/60 text-sm">
                    No new messages
                  </div>
                ) : (
                  <>
                    {messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`p-2 rounded-md ${message.read ? 'bg-downscale-blue/10' : 'bg-downscale-blue/30'}`}
                        onClick={() => markAsRead(message.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <div className="mt-0.5">
                              {getMessageIcon(message.title)}
                            </div>
                            <div>
                              <p className="text-sm text-downscale-cream">
                                {message.body}
                              </p>
                              <p className="text-xs text-downscale-cream/60 mt-1">
                                {formatTimestamp(message.sentAt)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }} 
                            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Separator className="my-2 bg-downscale-brown/20" />
                    
                    <div className="flex justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllMessages} 
                        className="text-xs text-downscale-cream/70"
                      >
                        Clear all messages
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
