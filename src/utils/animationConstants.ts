/**
 * Centralized animation constants to ensure consistency across the app
 * and make it easy to adjust timing globally
 */

export const ANIMATION_CONSTANTS = {
    // Viewport detection margin for scroll-triggered animations
    VIEWPORT_MARGIN: '-100px',

    // Animation durations (in seconds for Framer Motion)
    DURATION_FAST: 0.2,
    DURATION_NORMAL: 0.4,
    DURATION_SLOW: 0.6,
    DURATION_EXTRA_SLOW: 1.5,

    // Stagger delays (in seconds)
    STAGGER_DELAY: 0.15,
    STAGGER_DELAY_FAST: 0.1,
    STAGGER_DELAY_MAX: 0.6, // Cap maximum delay for late items

    // Easing functions
    EASE_SMOOTH: [0.22, 1, 0.36, 1] as const,
    EASE_ELASTIC: [0.34, 1.56, 0.64, 1] as const,
    EASE_IN_OUT: 'easeInOut' as const,
    EASE_OUT: 'easeOut' as const,
    EASE_IN: 'easeIn' as const,

    // Icon sizes (Tailwind classes)
    ICON_SM: 'w-4 h-4',
    ICON_MD: 'w-5 h-5',
    ICON_LG: 'w-6 h-6',
    ICON_XL: 'w-9 h-9',

    // Container sizes for backgrounds
    BLOB_LARGE_WIDTH: 760,
    BLOB_LARGE_HEIGHT: 420,
    BLOB_MEDIUM_WIDTH: 520,
    BLOB_MEDIUM_HEIGHT: 360,
} as const;

/**
 * Helper function to cap animation delay
 * Prevents excessive delays for items at the end of lists
 */
export function getStaggerDelay(index: number, delayPerItem: number = ANIMATION_CONSTANTS.STAGGER_DELAY): number {
    return Math.min(index * delayPerItem, ANIMATION_CONSTANTS.STAGGER_DELAY_MAX);
}
