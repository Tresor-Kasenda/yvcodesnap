import { ArrowRight, Layout, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CountUp } from '../animations/CountUp';
import { fadeInUp } from '../../utils/animationVariants';
import { users } from './data';
import { conversionHighlights, productBrand } from '../../content/product';

type HeroSectionProps = {
  onStart: () => void;
  onViewPricing: () => void;
};

export function HeroSection({ onStart, onViewPricing }: HeroSectionProps) {
  return (
    <section className="relative pt-20 pb-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-sm font-medium text-blue-600 dark:text-blue-400 mb-8 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>Free plan available. No credit card required.</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12 },
              },
            }}
          >
            <motion.span
              variants={fadeInUp}
              className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-600 dark:from-white dark:via-white dark:to-white/60 bg-clip-text text-transparent"
            >
              Turn your ideas into
            </motion.span>
            <br />
            <motion.span
              variants={fadeInUp}
              className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent"
            >
              visuals that drive attention
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            Launch social posts, presentations, docs, and tutorials faster with visuals that look premium from the first export.
            <span className="text-neutral-900 dark:text-white font-medium"> Start free now, then upgrade to Pro when you need brand scale and advanced exports.</span>
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
          >
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-2xl font-semibold text-lg transition-all"
            >
              <Zap className="w-5 h-5" />
              {productBrand.heroPrimaryCta}
              <span className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </span>
            </motion.button>
            <motion.button
              onClick={onViewPricing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-white rounded-2xl font-semibold text-lg transition-all"
            >
              <Layout className="w-5 h-5" />
              {productBrand.heroSecondaryCta}
            </motion.button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
          >
            {conversionHighlights.map((item) => (
              <span
                key={item}
                className="px-3 py-1 text-sm rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-white/5 dark:text-neutral-200 dark:border-white/10"
              >
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: 'easeOut' }}
          >
            <div className="flex items-center -space-x-3">
              {users.map((user, index) => (
                <motion.img
                  key={user.name}
                  src={user.avatar}
                  alt={user.name}
                  initial={{ opacity: 0, scale: 0, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.8 + index * 0.05,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white dark:border-neutral-900 object-cover shadow-lg transition-transform"
                />
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.8 + users.length * 0.05,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white dark:border-neutral-900 bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs md:text-sm font-semibold shadow-lg"
              >
                +<CountUp value={productBrand.socialProofCount} />
              </motion.div>
            </div>
            <motion.p
              className="text-sm text-neutral-500 dark:text-neutral-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              Trusted by <span className="font-semibold text-neutral-700 dark:text-white"><CountUp value={productBrand.socialProofCount} /></span> {productBrand.socialProofText}
            </motion.p>
          </motion.div>
        </div>

        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-purple-500/20 blur-3xl rounded-3xl" />
          <div
            className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-2 border border-white/10"
            style={{ perspective: '1000px' }}
          >
            <div className="aspect-video rounded-2xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/D7__t7uShNw?rel=0&modestbranding=1"
                title={productBrand.demoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
