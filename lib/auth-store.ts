import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { api, configureApi } from './api';
import { supabase } from './supabase';
import { UserProfile } from './types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string } | { success: true }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string } | { success: true }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setOnboarded: (value: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => {
  // Configure API client with token getter and 401 handler
  configureApi(
    () => get().session?.access_token ?? null,
    () => get().signOut()
  );

  return {
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isOnboarded: false,

    initialize: async () => {
      set({ isLoading: true });

      // Get existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        set({ session, user: session.user });
        await get().fetchProfile();
      }

      set({ isLoading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session) {
          await get().fetchProfile();
        } else {
          set({ profile: null, isOnboarded: false });
        }
      });
    },

    signInWithEmail: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return { success: true };
    },

    signUpWithEmail: async (email, password, fullName) => {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }
      return { success: true };
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({
        session: null,
        user: null,
        profile: null,
        isOnboarded: false,
      });
    },

    fetchProfile: async () => {
      const { data, error } = await api.profile.get();
      if (data) {
        const isOnboarded = Boolean(data.npi && data.licenseStates?.length > 0);
        set({ profile: data, isOnboarded });
      } else {
        // Profile might not exist yet for new users
        set({ isOnboarded: false });
      }
    },

    setOnboarded: (value) => set({ isOnboarded: value }),
  };
});
