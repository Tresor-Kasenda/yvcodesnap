import { memo } from 'react';
import { ArrowRight, Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';

type FinalCtaSectionProps = {
  onStart: () => void;
  onViewPricing: () => void;
};

function FinalCtaSectionComponent({ onStart, onViewPricing }: FinalCtaSectionProps) {
  return (
    <motion.section
      className="relative py-32 px-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <motion.div
        className="max-w-4xl mx-auto text-center"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: 'easeOut' },
          },
        }}
      >
        <motion.div
          className="relative bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 rounded-3xl p-12 md:p-16 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none"
            initial={{ scale: 1, opacity: 0.3 }}
            whileInView={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            viewport={{ once: false }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="relative">
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              variants={fadeInUp}
            >
              Ready to publish your next visual today?
            </motion.h2>
            <motion.p
              className="text-xl text-white/80 mb-8 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Start on Free to test your workflow. Move to Pro when you want stronger branding, higher export quality, and faster weekly production.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <motion.button
                type="button"
                onClick={onStart}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-2xl font-semibold text-lg transition-all"
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-5 h-5" />
                Start Free Now
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </motion.button>
              <motion.button
                type="button"
                onClick={onViewPricing}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-lg border border-white/20 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Crown className="w-5 h-5" />
                View Pro Benefits
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export const FinalCtaSection = memo(FinalCtaSectionComponent);
