import type { Variants } from 'framer-motion';

// Fade in from bottom with slide up
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// Fade in with scale up
export const fadeInScale: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

// Pop animation (scale from 0 with spring)
export const pop: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1], // Spring-like curve
        },
    },
};

// Slide in from left
export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

// Slide in from right
export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

// Stagger container for list animations
export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

// Stagger container for slower animations
export const staggerContainerSlow: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

// Rotate and fade in
export const rotateIn: Variants = {
    hidden: { opacity: 0, rotate: -20 },
    visible: {
        opacity: 1,
        rotate: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};
