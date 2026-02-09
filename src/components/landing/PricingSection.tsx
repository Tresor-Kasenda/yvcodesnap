import type { RefObject } from 'react';
import { Check, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';
import { pricingPlans } from './data';

export type BillingCycle = 'monthly' | 'yearly';

type PricingSectionProps = {
  pricingRef: RefObject<HTMLDivElement | null>;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onStart: () => void;
};

export function PricingSection({ pricingRef, billingCycle, onBillingCycleChange, onStart }: PricingSectionProps) {
  const formatPrice = (value: number) => {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  };
  return (
    <motion.section
      ref={pricingRef}
      id="pricing"
      className="relative py-32 px-6 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm font-medium text-purple-600 dark:text-purple-400 mb-6"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            <Crown className="w-4 h-4" />
            <span>Pricing built for growth</span>
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
            variants={fadeInUp}
          >
            Start free, then scale with Pro when publishing becomes serious
          </motion.h2>
          <motion.p
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Keep zero cost while testing. Upgrade when your content workflow needs premium export quality and brand consistency.
          </motion.p>

          <motion.div
            className="mt-8 flex justify-center"
            variants={fadeInUp}
          >
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => onBillingCycleChange('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onBillingCycleChange('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Save 17%</span>
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={staggerContainer}
        >
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-white dark:bg-white/5 border rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'border-blue-500 dark:border-blue-500/50'
                  : 'border-neutral-200 dark:border-white/10'
              }`}
              variants={fadeInUp}
              whileHover={{
                y: -12,
                scale: 1.02,
              }}
            >
              {plan.popular && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold rounded-full"
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.15 + 0.3,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  Best conversion value
                </motion.div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">{plan.name}</h3>
                <p className="text-neutral-500 dark:text-neutral-500 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  {plan.monthlyPrice !== 0 && (
                    <span className="text-neutral-500">{billingCycle === 'monthly' ? '/month' : '/year'}</span>
                  )}
                </div>
                {plan.monthlyPrice !== 0 && billingCycle === 'yearly' && (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    {`Equivalent to $${formatPrice(plan.yearlyPrice / 12)}/month, billed annually`}
                  </p>
                )}
              </div>
              <motion.ul
                className="space-y-3 mb-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: index * 0.15 + 0.4,
                    },
                  },
                }}
              >
                {plan.features.map((feature, i) => (
                  <motion.li
                    key={feature}
                    className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300"
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.3 },
                      },
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.15 + 0.4 + i * 0.05,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    >
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    </motion.div>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.button
                onClick={onStart}
                whileHover={{
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white'
                    : 'bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-900 dark:text-white'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
