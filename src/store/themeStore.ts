import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    updateEffectiveTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
        return getSystemTheme();
    }
    return theme;
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light', // Default to light mode
            effectiveTheme: 'light',

            setTheme: (theme: Theme) => {
                const effectiveTheme = getEffectiveTheme(theme);
                set({ theme, effectiveTheme });

                // Update document class
                if (effectiveTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            updateEffectiveTheme: () => {
                const { theme } = get();
                const effectiveTheme = getEffectiveTheme(theme);
                set({ effectiveTheme });

                // Update document class
                if (effectiveTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Apply theme on page load
                    const effectiveTheme = getEffectiveTheme(state.theme);
                    if (effectiveTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            },
        }
    )
);

// Listen to system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const store = useThemeStore.getState();
        if (store.theme === 'system') {
            store.updateEffectiveTheme();
        }
    });
}
