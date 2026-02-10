import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BrandingInfo {
  name: string;
  website: string;
  social: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
    youtube?: string;
    tiktok?: string;
  };
  avatarUrl?: string;
}

interface BrandingPreferences {
  enabled: boolean;
  position:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  showName: boolean;
  showWebsite: boolean;
  showSocial: boolean;
  showAvatar: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  padding: number;
  socialIconSize: number;
  socialLayout: 'horizontal' | 'vertical';
  avatarSize: number;
}

interface BrandingStore {
  info: BrandingInfo;
  preferences: BrandingPreferences;

  // Actions
  updateInfo: (updates: Partial<BrandingInfo>) => void;
  updateSocial: (platform: string, value: string) => void;
  updatePreferences: (updates: Partial<BrandingPreferences>) => void;
  resetToDefaults: () => void;
}

const defaultInfo: BrandingInfo = {
  name: '',
  website: '',
  social: {},
  avatarUrl: '',
};

const MAX_PERSISTED_AVATAR_LENGTH = 350000;

const defaultPreferences: BrandingPreferences = {
  enabled: false,
  position: 'bottom-right',
  showName: true,
  showWebsite: true,
  showSocial: true,
  showAvatar: false,
  fontSize: 14,
  fontFamily: 'Inter',
  color: '#ffffff',
  opacity: 0.8,
  padding: 24,
  socialIconSize: 20,
  socialLayout: 'horizontal',
  avatarSize: 56,
};

export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set) => ({
      info: defaultInfo,
      preferences: defaultPreferences,

      updateInfo: (updates) => set((state) => ({
        info: { ...state.info, ...updates },
      })),

      updateSocial: (platform, value) => set((state) => ({
        info: {
          ...state.info,
          social: { ...state.info.social, [platform]: value },
        },
      })),

      updatePreferences: (updates) => set((state) => ({
        preferences: { ...state.preferences, ...updates },
      })),

      resetToDefaults: () => set({
        info: defaultInfo,
        preferences: defaultPreferences,
      }),
    }),
    {
      name: 'yvcode-branding',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
          };
        }

        return {
          getItem: (name: string) => window.localStorage.getItem(name),
          setItem: (name: string, value: string) => {
            try {
              window.localStorage.setItem(name, value);
            } catch (error) {
              console.warn('Failed to persist branding preferences (quota exceeded).', error);
            }
          },
          removeItem: (name: string) => window.localStorage.removeItem(name),
        };
      }),
      partialize: (state) => ({
        info: {
          ...state.info,
          avatarUrl: state.info.avatarUrl && state.info.avatarUrl.length > MAX_PERSISTED_AVATAR_LENGTH
            ? ''
            : state.info.avatarUrl,
        },
        preferences: state.preferences,
      }),
    }
  )
);
