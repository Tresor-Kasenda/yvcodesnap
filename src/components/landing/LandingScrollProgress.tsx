import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

export function LandingScrollProgress() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const smoothedProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    mass: 0.2,
  });

  const progress = prefersReducedMotion ? scrollYProgress : smoothedProgress;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-neutral-200/40 dark:bg-white/10"
    >
      <motion.div
        className="h-full origin-left will-change-transform bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
        style={{ scaleX: progress }}
      />
    </div>
  );
}
