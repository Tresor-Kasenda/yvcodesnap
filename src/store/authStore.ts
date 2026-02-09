import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Subscription } from '../types';
import type { Session } from '@supabase/supabase-js';

let authChangeSubscription: { unsubscribe: () => void } | null = null;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: Subscription;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unexpected authentication error';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  subscription: {
    tier: 'free',
    snap_limit: 2,
    current_snap_count: 0,
  },

  initialize: async () => {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ user: session.user as User, session, loading: false });
        await get().fetchSubscription();
      } else {
        set({ loading: false });
      }

      // Listen to auth changes
      if (!authChangeSubscription) {
        const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          set({ user: (nextSession?.user as User) ?? null, session: nextSession });
          if (nextSession) {
            await get().fetchSubscription();
          }
        });
        authChangeSubscription = data.subscription;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/editor`,
        },
      });

      if (error) return { error: error.message };
      // Supabase can return a user without session when email confirmation is required.
      if (data.user && data.session) {
        set({ user: data.user as User, session: data.session });
      }
      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      set({ user: data.user as User, session: data.session });
      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  signInWithOAuth: async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/editor`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  signInWithMagicLink: async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/editor`,
        },
      });

      if (error) return { error: error.message };
      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) return { error: error.message };
      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  fetchSubscription: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // Count user's snaps
      const { count } = await supabase
        .from('snaps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // TODO: Fetch actual subscription tier from profiles table or Stripe
      // For now, hardcode free tier
      set({
        subscription: {
          tier: 'free',
          snap_limit: 2,
          current_snap_count: count ?? 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  },
}));
