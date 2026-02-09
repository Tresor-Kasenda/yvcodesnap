import { motion } from 'framer-motion';
import { trustedBy } from './data';

export function TrustedBySection() {
  return (
    <motion.section
      className="relative py-16 px-6 border-y border-neutral-200/50 dark:border-white/5 bg-neutral-100/50 dark:bg-white/2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.p
          className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-8 uppercase tracking-wider"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          Teams and creators building with YvCode
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {trustedBy.map((company, index) => (
            <motion.div
              key={company}
              className="text-2xl md:text-3xl font-bold text-neutral-300 dark:text-neutral-700 hover:text-neutral-400 dark:hover:text-neutral-600 transition-colors cursor-default"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.4, ease: 'easeOut' },
                },
              }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              transition={{ delay: index * 0.03 }}
            >
              {company}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
