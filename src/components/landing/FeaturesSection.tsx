import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';
import { features } from './data';

export function FeaturesSection() {
  return (
    <motion.section
      id="features"
      className="relative py-32 px-6 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-6"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Built to convert attention into growth</span>
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
            variants={fadeInUp}
          >
            Everything you need to publish high-performing code content
          </motion.h2>
          <motion.p
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Every feature is designed to reduce production time and increase the visual quality of your posts.
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 group-hover:border-blue-500/40',
              purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20 group-hover:border-purple-500/40',
              emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 group-hover:border-emerald-500/40',
              orange: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 group-hover:border-orange-500/40',
              pink: 'bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/20 group-hover:border-pink-500/40',
              cyan: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20 group-hover:border-cyan-500/40',
            };

            return (
              <motion.div
                key={feature.title}
                className="group relative bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 rounded-2xl p-8 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -8 }}
              >
                <motion.div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors ${colorClasses[feature.color as keyof typeof colorClasses]}`}
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    rotate: { duration: 0.4 },
                    scale: { duration: 0.2 },
                  }}
                >
                  <Icon className="w-7 h-7" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">{feature.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}
