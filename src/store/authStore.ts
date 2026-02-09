import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { OnboardingPreferences, User, Subscription } from '../types';
import type { Session } from '@supabase/supabase-js';

let authChangeSubscription: { unsubscribe: () => void } | null = null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  subscription: Subscription;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  completeOnboarding: (preferences: OnboardingPreferences) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unexpected authentication error';

const getOnboardingStatus = (user: User | null | undefined) =>
  user?.user_metadata?.onboarding_completed === true;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  loading: true,
  hasCompletedOnboarding: false,
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
        const nextUser = session.user as User;
        set({
          user: nextUser,
          session,
          loading: false,
          hasCompletedOnboarding: getOnboardingStatus(nextUser),
        });
        await get().fetchSubscription();
      } else {
        set({ loading: false, hasCompletedOnboarding: false });
      }

      // Listen to auth changes
      if (!authChangeSubscription) {
        const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          const nextUser = (nextSession?.user as User) ?? null;
          set({
            user: nextUser,
            session: nextSession,
            hasCompletedOnboarding: getOnboardingStatus(nextUser),
          });
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
        const nextUser = data.user as User;
        set({
          user: nextUser,
          session: data.session,
          hasCompletedOnboarding: getOnboardingStatus(nextUser),
        });
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
      const nextUser = data.user as User;
      set({
        user: nextUser,
        session: data.session,
        hasCompletedOnboarding: getOnboardingStatus(nextUser),
      });
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

  completeOnboarding: async (preferences) => {
    const currentUser = get().user;
    if (!currentUser) {
      return { error: 'Not authenticated' };
    }

    const completedAt = new Date().toISOString();

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
          onboarding_preferences: preferences,
        },
      });

      if (error) {
        return { error: error.message };
      }

      const updatedUser = ((data.user as User | null) ?? {
        ...currentUser,
        user_metadata: {
          ...(currentUser.user_metadata ?? {}),
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
          onboarding_preferences: preferences,
        },
      }) as User;

      set({
        user: updatedUser,
        hasCompletedOnboarding: true,
      });

      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, hasCompletedOnboarding: false });
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
