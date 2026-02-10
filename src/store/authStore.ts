import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { OnboardingPreferences, User, UserProfile, Subscription } from '../types';
import type { Session } from '@supabase/supabase-js';
import { getOAuthRedirectUrl } from '../config/auth';

let authChangeSubscription: { unsubscribe: () => void } | null = null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  subscription: Subscription;

  // Actions
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  completeOnboarding: (preferences: OnboardingPreferences) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  consumeFreeExportSlot: () => Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    error?: string;
  }>;
  cleanup: () => void;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unexpected authentication error';

const getMetadataOnboardingStatus = (user: User | null | undefined) =>
  user?.user_metadata?.onboarding_completed === true;

const getOnboardingStatus = (profile: UserProfile | null, user: User | null | undefined) =>
  profile?.onboarding_completed ?? getMetadataOnboardingStatus(user);

const withOnboardingMetadata = (user: User, preferences: OnboardingPreferences, completedAt: string): User => ({
  ...user,
  user_metadata: {
    ...(user.user_metadata ?? {}),
    full_name: preferences.fullName,
    onboarding_completed: true,
    onboarding_completed_at: completedAt,
    onboarding_preferences: {
      fullName: preferences.fullName,
      useCase: preferences.useCase,
      experienceLevel: preferences.experienceLevel,
      primaryFormat: preferences.primaryFormat,
      planIntent: preferences.planIntent,
    },
  },
});

const FREE_SUBSCRIPTION: Subscription = {
  tier: 'free',
  snap_limit: 2,
  current_snap_count: 0,
};
const FREE_EXPORT_LIMIT = 4;
const FREE_EXPORT_STORAGE_PREFIX = 'yvcode:free-exports-used:';

const getStoredFreeExportCount = (userId: string): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(`${FREE_EXPORT_STORAGE_PREFIX}${userId}`);
  const parsed = Number.parseInt(raw ?? '0', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const setStoredFreeExportCount = (userId: string, value: number) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    `${FREE_EXPORT_STORAGE_PREFIX}${userId}`,
    String(Math.max(0, Math.floor(value)))
  );
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  hasCompletedOnboarding: false,
  subscription: FREE_SUBSCRIPTION,

  initialize: async () => {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const nextUser = session.user as User;
        set({
          user: nextUser,
          session,
          profile: null,
          loading: false,
          hasCompletedOnboarding: getMetadataOnboardingStatus(nextUser),
        });
        await get().fetchProfile();
        await get().fetchSubscription();
      } else {
        set({
          loading: false,
          profile: null,
          hasCompletedOnboarding: false,
          subscription: FREE_SUBSCRIPTION,
        });
      }

      // Listen to auth changes
      if (!authChangeSubscription) {
        const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          const nextUser = (nextSession?.user as User) ?? null;
          set({
            user: nextUser,
            session: nextSession,
            profile: null,
            hasCompletedOnboarding: getMetadataOnboardingStatus(nextUser),
          });
          if (nextSession) {
            await get().fetchProfile();
            await get().fetchSubscription();
          } else {
            set({
              profile: null,
              hasCompletedOnboarding: false,
              subscription: FREE_SUBSCRIPTION,
            });
          }
        });
        authChangeSubscription = data.subscription;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ profile: null, hasCompletedOnboarding: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Failed to fetch profile:', error);
        }
        set({
          profile: null,
          hasCompletedOnboarding: getMetadataOnboardingStatus(user),
        });
        return;
      }

      const nextProfile = (data as UserProfile | null) ?? null;
      if (nextProfile && user.id) {
        const serverCount = Math.max(0, Number(nextProfile.free_exports_used ?? 0));
        const localCount = getStoredFreeExportCount(user.id);
        if (serverCount > localCount) {
          setStoredFreeExportCount(user.id, serverCount);
        }
      }
      set({
        profile: nextProfile,
        hasCompletedOnboarding: getOnboardingStatus(nextProfile, user),
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      set({
        profile: null,
        hasCompletedOnboarding: getMetadataOnboardingStatus(user),
      });
    }
  },

  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getOAuthRedirectUrl('/editor'),
        },
      });

      if (error) return { error: error.message };
      // Supabase can return a user without session when email confirmation is required.
      if (data.user && data.session) {
        const nextUser = data.user as User;
        set({
          user: nextUser,
          session: data.session,
          profile: null,
          hasCompletedOnboarding: getMetadataOnboardingStatus(nextUser),
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
        profile: null,
        hasCompletedOnboarding: getMetadataOnboardingStatus(nextUser),
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
          redirectTo: getOAuthRedirectUrl('/editor'),
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
        redirectTo: getOAuthRedirectUrl('/login'),
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

    const fullName = preferences.fullName.trim();
    if (fullName.length < 2) {
      return { error: 'Please provide a valid name.' };
    }

    const completedAt = new Date().toISOString();

    try {
      const profilePayload = {
        id: currentUser.id,
        full_name: fullName,
        onboarding_completed: true,
        onboarding_completed_at: completedAt,
        onboarding_use_case: preferences.useCase,
        onboarding_experience_level: preferences.experienceLevel,
        onboarding_primary_format: preferences.primaryFormat,
        onboarding_plan_intent: preferences.planIntent,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) {
        return { error: error.message };
      }

      const normalizedPreferences: OnboardingPreferences = {
        ...preferences,
        fullName,
      };
      const updatedUser = withOnboardingMetadata(currentUser, normalizedPreferences, completedAt);

      set({
        user: updatedUser,
        profile: data as UserProfile,
        hasCompletedOnboarding: true,
      });

      // Keep auth metadata in sync so OAuth providers can expose the user's display name.
      const { error: userMetadataError } = await supabase.auth.updateUser({
        data: updatedUser.user_metadata,
      });
      if (userMetadataError) {
        console.warn('Could not sync onboarding metadata to auth.user_metadata:', userMetadataError.message);
      }

      return {};
    } catch (error: unknown) {
      return { error: getErrorMessage(error) };
    }
  },

  signOut: async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw new Error(error.message);
      }

      // Clear local auth state
      set({
        user: null,
        session: null,
        profile: null,
        hasCompletedOnboarding: false,
        subscription: FREE_SUBSCRIPTION,
      });

      // Cleanup auth subscription if exists
      const cleanup = get().cleanup;
      cleanup();
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still clear local state even if Supabase sign out fails
      set({
        user: null,
        session: null,
        profile: null,
        hasCompletedOnboarding: false,
        subscription: FREE_SUBSCRIPTION,
      });
      throw error;
    }
  },

  fetchSubscription: async () => {
    const { user, profile } = get();
    if (!user) return;

    try {
      // Count user's snaps
      const { count } = await supabase
        .from('snaps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const tier = profile?.subscription_tier ?? 'free';
      set({
        subscription: {
          tier,
          snap_limit: tier === 'pro' ? -1 : 2,
          current_snap_count: count ?? 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      set({ subscription: FREE_SUBSCRIPTION });
    }
  },

  consumeFreeExportSlot: async () => {
    const { user, profile } = get();
    if (!user) {
      return {
        allowed: true,
        used: 0,
        limit: FREE_EXPORT_LIMIT,
        remaining: FREE_EXPORT_LIMIT,
      };
    }

    const tier = profile?.subscription_tier ?? 'free';
    const profileUsed = Math.max(0, Number(profile?.free_exports_used ?? 0));
    const localUsed = getStoredFreeExportCount(user.id);
    const baseUsed = Math.max(profileUsed, localUsed);

    if (tier === 'pro') {
      return {
        allowed: true,
        used: baseUsed,
        limit: -1,
        remaining: -1,
      };
    }

    try {
      const { data, error } = await supabase.rpc('consume_free_export_slot');
      if (error) {
        throw error;
      }

      const payload = (data ?? {}) as {
        allowed?: boolean;
        used?: number;
        limit?: number;
        remaining?: number;
      };

      const used = Math.max(0, Number(payload.used ?? baseUsed));
      const limit = Number(payload.limit ?? FREE_EXPORT_LIMIT);
      const remaining = limit === -1 ? -1 : Math.max(0, Number(payload.remaining ?? Math.max(0, limit - used)));
      const allowed = payload.allowed === true;

      setStoredFreeExportCount(user.id, used);
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, free_exports_used: used }
          : state.profile,
      }));

      return {
        allowed,
        used,
        limit,
        remaining,
      };
    } catch (error) {
      // If RPC or schema is not yet available, keep enforcing in client as fallback.
      const normalized = getErrorMessage(error).toLowerCase();
      const canFallback =
        normalized.includes('consume_free_export_slot') ||
        normalized.includes('function') ||
        normalized.includes('schema cache');

      if (!canFallback) {
        return {
          allowed: false,
          used: baseUsed,
          limit: FREE_EXPORT_LIMIT,
          remaining: Math.max(0, FREE_EXPORT_LIMIT - baseUsed),
          error: getErrorMessage(error),
        };
      }

      if (baseUsed >= FREE_EXPORT_LIMIT) {
        return {
          allowed: false,
          used: baseUsed,
          limit: FREE_EXPORT_LIMIT,
          remaining: 0,
        };
      }

      const nextUsed = baseUsed + 1;
      const remaining = Math.max(0, FREE_EXPORT_LIMIT - nextUsed);
      setStoredFreeExportCount(user.id, nextUsed);
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, free_exports_used: nextUsed }
          : state.profile,
      }));

      await supabase
        .from('profiles')
        .update({ free_exports_used: nextUsed })
        .eq('id', user.id);

      return {
        allowed: true,
        used: nextUsed,
        limit: FREE_EXPORT_LIMIT,
        remaining,
      };
    }
  },

  cleanup: () => {
    if (authChangeSubscription) {
      authChangeSubscription.unsubscribe();
      authChangeSubscription = null;
    }
  },
}));
