import { memo } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';
import { testimonials, type Testimonial } from './data';
import { Avatar } from '../ui/Avatar';

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
  // Handle edge cases
  if (!array || array.length === 0) {
    return [];
  }

  if (chunkSize <= 0) {
    return [array];
  }

  const result: Testimonial[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

const testimonialChunks = chunkArray(testimonials, Math.ceil(testimonials.length / 3));

function TestimonialsSectionComponent() {
  return (
    <motion.section
      id="testimonials"
      className="py-16 md:py-32"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-semibold text-neutral-900 dark:text-white"
            variants={fadeInUp}
          >
            Results teams can feel in their weekly workflow
          </motion.h2>
          <motion.p
            className="mt-6 text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Better visual quality, less editing time, and faster publishing across channels.
          </motion.p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
          {testimonialChunks.map((chunk, chunkIndex) => (
            <div
              key={chunkIndex}
              className="space-y-3"
            >
              {chunk.map(({ name, role, quote, image, initials }) => (
                <motion.div
                  key={`testimonial-${name.replace(/\s+/g, '-').toLowerCase()}`}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5"
                  variants={fadeInUp}
                >
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <Avatar
                      src={image}
                      alt={`${name}'s profile picture`}
                      initials={initials}
                      size="md"
                    />

                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">{name}</h3>
                      <span className="block text-sm tracking-wide text-neutral-500 dark:text-neutral-400">{role}</span>
                      <blockquote className="mt-3">
                        <p className="text-neutral-700 dark:text-neutral-300">{quote}</p>
                      </blockquote>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export const TestimonialsSection = memo(TestimonialsSectionComponent);
