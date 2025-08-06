import { create } from 'zustand';
import { User, UserProfile } from '../types';
import { supabase } from '../config/supabase';
import { DEV_USER_ID } from '../config/constants';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  tempProfile: any;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, name: string, age: number, gender: string, location: string, dateOfBirth?: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  tempProfile: null,

  initialize: async () => {
    console.log('=== AUTH INITIALIZE START ===');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session?.user ? 'User found' : 'No user');
      if (session?.user) {
        set({ user: session.user });
        // Load profile
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          console.log('Profile in initialize:', profile ? 'Found' : 'Not found');
          if (profile && !error) {
            set({ profile });
          }
        } catch (error) {
          console.log('Profile load error in initialize:', error);
        }
      }
    } catch (error) {
      console.log('Initialize error:', error);
    } finally {
      console.log('=== AUTH INITIALIZE COMPLETE ===');
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }
    
    // Load user profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profile && !profileError) {
        set({ user: data.user, profile, loading: false });
      } else {
        set({ user: data.user, profile: null, loading: false });
      }
    } catch (error) {
      console.log('Profile load error in signIn:', error);
      set({ user: data.user, profile: null, loading: false });
    }
  },

  signUp: async (email: string, name: string, age: number, gender: string, location: string, dateOfBirth?: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      set({ loading: false });
      throw error;
    }
    
    // Store profile data temporarily for after OTP verification
    set({ 
      loading: false,
      tempProfile: { name, age, gender, location, dateOfBirth, email }
    });
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null, loading: false });
  },

  resetPassword: async (email: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined
    });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({ loading: false });
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      set({ loading: false });
      throw error;
    }
    
    // Create profile after successful OTP verification
    const { tempProfile } = get();
    if (data.user && tempProfile) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            ...tempProfile,
            points_balance: 0
          });
        
        if (!profileError) {
          set({ profile: { user_id: data.user.id, ...tempProfile, points_balance: 0 } });
        }
      } catch (profileError) {
        console.log('Profile creation failed:', profileError);
      }
    }
    
    set({ user: data.user, loading: false, tempProfile: null });
  },

  updateProfile: async (profileData: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, ...profileData });
    
    if (error) throw error;
    set({ profile: { ...get().profile, ...profileData } as UserProfile });
  },
}));