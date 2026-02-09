import { memo } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';
import { ANIMATION_CONSTANTS, getStaggerDelay } from '../../utils/animationConstants';
import { howItWorks } from './data';

// Type-safe color mapping
type AllowedColor = 'blue' | 'purple' | 'emerald';

const COLOR_CLASSES: Record<AllowedColor, string> = {
  blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
};

// Extract animation configs to module level (prevent recreation on each render)
const iconHoverAnimation = {
  scale: 1.1,
  rotate: [0, -10, 10, 0],
};

const iconTransition = {
  rotate: { duration: 0.5 },
  scale: { duration: 0.2 },
};

function HowItWorksSectionComponent() {
  return (
    <motion.section
      id="how-it-works"
      className="relative py-32 px-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-600 dark:text-blue-400 mb-6"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            <Zap className="w-4 h-4" />
            <span>Simple workflow</span>
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
            variants={fadeInUp}
          >
            Go from draft to publish-ready in 3 steps
          </motion.h2>
          <motion.p
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Start for free in minutes, then unlock Pro when you need advanced export quality and deeper brand control.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <motion.div
            className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
            style={{ transformOrigin: 'left' }}
          />

          {howItWorks.map((item, index) => {
            const Icon = item.icon;
            const itemColor = item.color as AllowedColor;
            const colorClass = COLOR_CLASSES[itemColor] || COLOR_CLASSES.blue;

            return (
              <motion.div
                key={item.title}
                className="relative text-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: ANIMATION_CONSTANTS.DURATION_SLOW,
                  delay: getStaggerDelay(index),
                  ease: ANIMATION_CONSTANTS.EASE_SMOOTH,
                }}
              >
                <div className="inline-flex flex-col items-center">
                  <motion.div
                    className="relative mb-6"
                    whileHover={iconHoverAnimation}
                    transition={iconTransition}
                  >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${colorClass}`}>
                      <Icon className={ANIMATION_CONSTANTS.ICON_XL} />
                    </div>
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: ANIMATION_CONSTANTS.DURATION_NORMAL,
                        delay: Math.min(index * 0.1, ANIMATION_CONSTANTS.STAGGER_DELAY_MAX),
                        ease: ANIMATION_CONSTANTS.EASE_ELASTIC,
                      }}
                    >
                      {item.step}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">{item.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xs">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

export const HowItWorksSection = memo(HowItWorksSectionComponent);
