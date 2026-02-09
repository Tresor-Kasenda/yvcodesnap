import { useState, memo } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';
import { faqs } from './data';

function FaqSectionComponent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <motion.section
      id="faq"
      className="relative py-32 px-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-600 dark:text-orange-400 mb-6"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
            variants={fadeInUp}
          >
            Clear answers before you commit
          </motion.h2>
          <motion.p
            className="text-xl text-neutral-600 dark:text-neutral-400"
            variants={fadeInUp}
          >
            Everything needed to decide when Free is enough and when Pro is worth it.
          </motion.p>
        </div>

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              className="bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/20"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4 },
                },
              }}
            >
              <motion.button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                whileHover={{
                  backgroundColor: openFaq === index ? undefined : 'rgba(255, 255, 255, 0.02)',
                  transition: { duration: 0.2 },
                }}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                aria-expanded={openFaq === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
                type="button"
              >
                <span className="font-semibold text-neutral-900 dark:text-white">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  aria-hidden="true"
                >
                  <ChevronDown className="w-5 h-5 text-neutral-500 shrink-0" />
                </motion.div>
              </motion.button>
              <AnimatePresence initial={false}>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: 'auto',
                      opacity: 1,
                      transition: {
                        height: { duration: 0.3, ease: 'easeOut' },
                        opacity: { duration: 0.2, delay: 0.1 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3, ease: 'easeIn' },
                        opacity: { duration: 0.2 },
                      },
                    }}
                    style={{ overflow: 'hidden' }}
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <p className="px-6 pb-5 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

export const FaqSection = memo(FaqSectionComponent);
