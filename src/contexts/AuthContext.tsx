import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfilesRow } from '@/types/supabase-augmentation';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string, persistSession?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  waterGoal: number;
  setWaterGoal: (goal: number) => Promise<void>;
  userProfile: ProfilesRow | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the hook separately
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the provider as a named export
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterGoal, setWaterGoalState] = useState(3000);
  const [userProfile, setUserProfile] = useState<ProfilesRow | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle redirection when session state changes
  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true });
    }
  }, [session, loading, navigate]);

  const ensureProfileExists = async (targetUserId: string, email?: string) => {
    // Try to fetch profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();
    if (!data || Object.keys(data).length === 0) {
      // Create default profile if missing or incomplete
      const upsertProfile = {
        user_id: targetUserId,
        display_name: '',
        email: email || '',
        phone_number: null,
        reminder_method: 'sms',
        reminders_enabled: false,
        water_goal: 3000,
        preferences: {},
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(upsertProfile, { onConflict: 'user_id' });
      if (upsertError) {
        console.error('[Profile Creation] Error auto-creating profile:', upsertError);
        toast.error('Failed to auto-create profile.');
      } else {
        console.log('[Profile Creation] Auto-created profile for user:', targetUserId, upsertProfile);
      }
    } else {
      // Patch missing fields if any
      let needsPatch = false;
      const patch: any = {};
      if (typeof data.display_name !== 'string') { patch.display_name = ''; needsPatch = true; }
      if (typeof data.email !== 'string') { patch.email = email || ''; needsPatch = true; }
      if (!('phone_number' in data)) { patch.phone_number = null; needsPatch = true; }
      if (!data.reminder_method) { patch.reminder_method = 'sms'; needsPatch = true; }
      if (typeof data.reminders_enabled !== 'boolean') { patch.reminders_enabled = false; needsPatch = true; }
      if (!data.water_goal) { patch.water_goal = 3000; needsPatch = true; }
      if (!data.preferences || typeof data.preferences !== 'object') { patch.preferences = {}; needsPatch = true; }
      if (needsPatch) {
        patch.user_id = targetUserId;
        patch.updated_at = new Date().toISOString();
        const { error: patchError } = await supabase
          .from('profiles')
          .upsert(patch, { onConflict: 'user_id' });
        if (patchError) {
          console.error('[Profile Patch] Error patching profile:', patchError);
        } else {
          console.log('[Profile Patch] Patched missing fields for user:', targetUserId, patch);
        }
      }
    }
  };

  const refreshUserProfile = async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        console.log("No user ID available for profile refresh");
        return;
      }
      await ensureProfileExists(targetUserId, user?.email);
      console.log("[Profile Fetch] Refreshing profile for user:", targetUserId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (error || !data) {
        console.error('[Profile Fetch] Error fetching profile:', error);
        toast.error('Failed to load profile. Please try again or contact support.');
        return;
      }
      // Fill missing fields with defaults
      const profileData: ProfilesRow = {
        user_id: data.user_id,
        display_name: typeof data.display_name === 'string' ? data.display_name : '',
        email: typeof data.email === 'string' ? data.email : (user?.email || ''),
        phone_number: 'phone_number' in data ? data.phone_number : null,
        reminder_method: data.reminder_method || 'sms',
        reminders_enabled: typeof data.reminders_enabled === 'boolean' ? data.reminders_enabled : false,
        water_goal: data.water_goal || 3000,
        preferences: data.preferences && typeof data.preferences === 'object' ? data.preferences : {},
        updated_at: data.updated_at || new Date().toISOString(),
      };
      setUserProfile(profileData);
      setWaterGoalState(profileData.water_goal);
      console.log('[Profile Fetch] Loaded profile:', profileData);
    } catch (error) {
      console.error('[Profile Fetch] Error in refreshUserProfile:', error);
      toast.error('Failed to load profile. Please try again or contact support.');
    }
  };

  // After session is set, always ensure profile exists
  useEffect(() => {
    if (user && session) {
      ensureProfileExists(user.id, user.email);
    }
  }, [user, session]);

  const setWaterGoal = async (goal: number) => {
    if (!user) return;

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({ water_goal: goal })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{ user_id: user.id, water_goal: goal }]);

        if (error) throw error;
      }

      setWaterGoalState(goal);
      await refreshUserProfile();
      toast.success("Water goal updated successfully");
    } catch (error) {
      console.error('Error setting water goal:', error);
      toast.error("Failed to update water goal");
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert([{ 
          user_id: data.user.id, 
          water_goal: 3000,
          display_name: name,
          email: email,
          preferences: {},
          reminders_enabled: false,
          reminder_method: null,
          phone_number: null
        }]);
        
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signIn = async (email: string, password: string, persistSession: boolean = true) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (!persistSession) {
        supabase.auth.setSession({
          access_token: session?.access_token || '',
          refresh_token: session?.refresh_token || '',
        });
      }
      
      toast.success("Logged in successfully!");
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserProfile(null);
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || "Failed to log out");
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    waterGoal,
    setWaterGoal,
    userProfile,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
