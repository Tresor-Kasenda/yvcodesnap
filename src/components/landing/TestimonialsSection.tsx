import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animationVariants';
import { testimonials, type Testimonial } from './data';

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
  const result: Testimonial[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

const testimonialChunks = chunkArray(testimonials, Math.ceil(testimonials.length / 3));

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function TestimonialsSection() {
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
            Results developers can feel in their weekly workflow
          </motion.h2>
          <motion.p
            className="mt-6 text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Better output quality, less editing time, and faster publishing across docs and social channels.
          </motion.p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
          {testimonialChunks.map((chunk, chunkIndex) => (
            <div
              key={chunkIndex}
              className="space-y-3"
            >
              {chunk.map(({ name, role, quote, image }, index) => (
                <motion.div
                  key={`${chunkIndex}-${index}-${name}`}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5"
                  variants={fadeInUp}
                >
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                      <span className="absolute inset-0 flex items-center justify-center">
                        {getInitials(name)}
                      </span>
                      <img
                        alt={name}
                        src={image}
                        loading="lazy"
                        width={120}
                        height={120}
                        className="relative h-full w-full rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

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
