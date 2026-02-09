import { useState, useRef } from 'react';
import { Layout, ChevronDown, Sparkles, Zap, Download, Palette, Code, ArrowRight, Check, Star, MousePointer2, Layers, Share2, Upload, Wand2, Image, HelpCircle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CountUp } from '../components/animations/CountUp';
import { fadeInUp, staggerContainer } from '../utils/animationVariants';

// Features data
const features = [
  {
    icon: Code,
    title: 'Syntax Highlighting',
    description: '50+ languages supported with beautiful themes',
    color: 'blue',
  },
  {
    icon: Palette,
    title: 'Stunning Backgrounds',
    description: 'Gradients, solid colors, and custom designs',
    color: 'purple',
  },
  {
    icon: Layers,
    title: 'Layer Management',
    description: 'Group, reorder, lock and organize elements',
    color: 'emerald',
  },
  {
    icon: MousePointer2,
    title: 'Drag & Drop Editor',
    description: 'Intuitive canvas with resize and rotate',
    color: 'orange',
  },
  {
    icon: Download,
    title: 'High-Res Export',
    description: 'PNG, JPEG at 2x resolution for crisp visuals',
    color: 'pink',
  },
  {
    icon: Share2,
    title: 'Social Ready',
    description: 'Preset sizes for Twitter, LinkedIn, Instagram',
    color: 'cyan',
  },
];

// Testimonials data
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Developer @ Stripe',
    avatar: '👩‍💻',
    content: "Finally, a tool that makes my code look as good as it runs. I use YvCode for all my Twitter posts now.",
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Tech Content Creator',
    avatar: '👨‍🎨',
    content: "The templates save me hours every week. My engagement has doubled since I started using YvCode.",
    rating: 5,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Open Source Maintainer',
    avatar: '👩‍🔬',
    content: "Beautiful code screenshots in seconds. The branding feature is perfect for documentation.",
    rating: 5,
  },
  {
    name: 'Elena',
    role: 'Open Source Maintainer',
    avatar: '👩‍🔬',
    content: "Beautiful code screenshots in seconds. The branding feature is perfect for documentation.",
    rating: 5,
  },

  {
    name: 'Rodriguez',
    role: 'Open Source Maintainer',
    avatar: '👩‍🔬',
    content: "Beautiful code screenshots in seconds. The branding feature is perfect for documentation.",
    rating: 3.5,
  },

  {
    name: 'Elena Rodriguez',
    role: 'Open Source Maintainer',
    avatar: '👩‍🔬',
    content: "Beautiful code screenshots in seconds. The branding feature is perfect for documentation.",
    rating: 4.5,
  },

  {
    name: 'Elen Rodriguez',
    role: 'Open Source Maintainer',
    avatar: '👩‍🔬',
    content: "Beautiful code screenshots in seconds. The branding feature is perfect for documentation.",
    rating: 5,
  },

  {
    name: 'Elena Rodrigue',
    role: 'Open Source Maintainer',
    avatar: '👩‍🔬',
    content: "Beautiful code screenshots in seconds. The branding feature is perfect for documentation.",
    rating: 4,
  },
];

// Users data - people using the app
const users = [
  { name: 'Alex', avatar: 'https://i.pravatar.cc/150?img=1' },
  { name: 'Sarah', avatar: 'https://i.pravatar.cc/150?img=5' },
  { name: 'Marcus', avatar: 'https://i.pravatar.cc/150?img=8' },
  { name: 'Elena', avatar: 'https://i.pravatar.cc/150?img=9' },
  { name: 'James', avatar: 'https://i.pravatar.cc/150?img=12' },
  { name: 'Priya', avatar: 'https://i.pravatar.cc/150?img=16' },
  { name: 'David', avatar: 'https://i.pravatar.cc/150?img=11' },
];

// Logos/Companies data
const trustedBy = [
  'Vercel', 'Stripe', 'GitHub', 'Netflix', 'Spotify', 'Airbnb'
];

// How it works steps
const howItWorks = [
  {
    step: 1,
    icon: Upload,
    title: 'Paste your code',
    description: 'Drop in any code snippet or start typing. We auto-detect the language.',
    color: 'blue',
  },
  {
    step: 2,
    icon: Wand2,
    title: 'Customize the look',
    description: 'Choose themes, backgrounds, fonts, and add your branding in seconds.',
    color: 'purple',
  },
  {
    step: 3,
    icon: Image,
    title: 'Export & share',
    description: 'Download in high resolution or copy directly to clipboard. Done!',
    color: 'emerald',
  },
];

// Pricing plans
const pricingPlans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started',
    features: [
      'Unlimited snapshots',
      '20+ syntax themes',
      'PNG & JPEG export',
      'Basic backgrounds',
      'Community templates',
    ],
    cta: 'Start Free',
    popular: false,
    color: 'neutral',
  },
  {
    name: 'Pro',
    monthlyPrice: 12,
    yearlyPrice: 120,
    description: 'For serious content creators',
    features: [
      'Everything in Free',
      'SVG & 4K export',
      'Custom branding',
      'Premium templates',
      'No watermark',
      'Priority support',
    ],
    cta: 'Go Pro',
    popular: true,
    color: 'blue',
  },
];

// FAQ data
const faqs = [
  {
    question: 'Is YvCode really free?',
    answer: 'Yes! The core features are 100% free with no sign-up required. We offer a Pro plan (monthly or yearly billing) for advanced features like custom branding and 4K export.',
  },
  {
    question: 'What languages are supported?',
    answer: 'We support 50+ programming languages including JavaScript, TypeScript, Python, Go, Rust, Java, C++, Swift, Kotlin, and many more. Syntax highlighting is automatic.',
  },
  {
    question: 'Can I use the images commercially?',
    answer: 'Absolutely! All images you create are yours to use however you want — social media, documentation, presentations, courses, or anywhere else.',
  },
  {
    question: 'Do you store my code?',
    answer: 'No. Everything happens in your browser. Your code never leaves your device unless you explicitly export or share it. Privacy is a priority.',
  },
  {
    question: 'What export formats are available?',
    answer: 'Free users can export PNG and JPEG at 2x resolution. Pro users get additional SVG export and 4K resolution for the crispest images possible.',
  },
  {
    question: 'Can I add my own branding?',
    answer: 'Yes! You can add your name, avatar, social handles, and custom colors. Pro users get additional branding features like custom watermarks and brand presets.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const pricingRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleNewSnap = () => {
    navigate('/auth/login');
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-sm font-medium text-blue-600 dark:text-blue-400 mb-8 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>100% Free — No sign-up required</span>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                />
              </motion.div>
            </motion.div>

            {/* Headline */}
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
                Turn your code into
              </motion.span>
              <br />
              <motion.span
                variants={fadeInUp}
                className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent"
              >
                stunning visuals
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              Create beautiful code screenshots for social media, documentation, and presentations — <span className="text-neutral-900 dark:text-white font-medium">in seconds, not hours.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
            >
              <motion.button
                onClick={handleNewSnap}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-2xl font-semibold text-lg transition-all"
              >
                <Zap className="w-5 h-5" />
                Start Creating — It's Free
                <motion.div
                  className="w-5 h-5 group-hover:translate-x-1"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
              <motion.button
                onClick={scrollToPricing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-white rounded-2xl font-semibold text-lg transition-all"
              >
                <Layout className="w-5 h-5" />
                View Pricing
              </motion.button>
            </motion.div>

            {/* Social Proof - User Avatars */}
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
            >
              <div className="flex items-center -space-x-3">
                {users.map((user, index) => (
                  <motion.img
                    key={index}
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
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white dark:border-neutral-900 object-cover shadow-lg cursor-pointer transition-transform"
                    title={user.name}
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
                  +<CountUp value={2000} />
                </motion.div>
              </div>
              <motion.p
                className="text-sm text-neutral-500 dark:text-neutral-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                Join <span className="font-semibold text-neutral-700 dark:text-white"><CountUp value={2000} /></span> developers creating beautiful code images
              </motion.p>
            </motion.div>
          </div>

          {/* Hero Visual - Video Presentation */}
          <div
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-purple-500/20 blur-3xl rounded-3xl" />
            <div
              className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-2 border border-white/10"
              style={{
                perspective: '1000px',
              }}
            >
              <div className="aspect-video rounded-2xl overflow-hidden">
                {/* YouTube Embed - optimized with lazy loading */}
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/D7__t7uShNw?rel=0&modestbranding=1"
                  title="YvCode Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By / Logos Section */}
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
            Trusted by developers at
          </motion.p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustedBy.map((company, index) => (
              <motion.div
                key={index}
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
              >
                {company}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="relative py-32 px-6 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2,
            },
          },
        }}
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
              <span>Powerful Features</span>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
              variants={fadeInUp}
            >
              Everything you need, nothing you don't
            </motion.h2>
            <motion.p
              className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              A focused set of tools designed to help you create beautiful code visuals fast.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
          >
            {features.map((feature, index) => {
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
                  key={index}
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

      {/* How It Works Section */}
      <motion.section
        id="how-it-works"
        className="relative py-32 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2,
            },
          },
        }}
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
              <span>Simple & Fast</span>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
              variants={fadeInUp}
            >
              Create in 3 simple steps
            </motion.h2>
            <motion.p
              className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              No learning curve. No complex tools. Just beautiful results.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
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
              const colorClasses = {
                blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
                purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
                emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
              };
              return (
                <motion.div
                  key={index}
                  className="relative text-center"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="inline-flex flex-col items-center">
                    <motion.div
                      className="relative mb-6"
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -10, 10, 0],
                      }}
                      transition={{
                        rotate: { duration: 0.5 },
                        scale: { duration: 0.2 },
                      }}
                    >
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-9 h-9" />
                      </div>
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.2 + 0.3,
                          ease: [0.34, 1.56, 0.64, 1],
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

      {/* Testimonials Section */}
      <motion.section
        id="testimonials"
        className="relative py-32 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2,
            },
          },
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-sm font-medium text-pink-600 dark:text-pink-400 mb-6"
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 },
              }}
            >
              <Star className="w-4 h-4" fill="currentColor" />
              <span>Loved by Developers</span>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
              variants={fadeInUp}
            >
              What creators are saying
            </motion.h2>
            <motion.p
              className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Join thousands of developers who share beautiful code every day.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="relative bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl p-8 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -8 }}
              >
                <motion.div
                  className="flex items-center gap-1 mb-4"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: index * 0.15 + 0.3,
                      },
                    },
                  }}
                >
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, scale: 0, rotate: -180 },
                        visible: {
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                          transition: {
                            duration: 0.4,
                            ease: [0.34, 1.56, 0.64, 1],
                          },
                        },
                      }}
                    >
                      <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    </motion.div>
                  ))}
                </motion.div>
                <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.15 + 0.5,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-neutral-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        ref={pricingRef}
        id="pricing"
        className="relative py-32 px-6 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2,
            },
          },
        }}
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
              <span>Simple Pricing</span>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent"
              variants={fadeInUp}
            >
              Start free, upgrade when ready
            </motion.h2>
            <motion.p
              className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              No hidden fees. No surprises. Cancel anytime.
            </motion.p>

            <motion.div
              className="mt-8 flex justify-center"
              variants={fadeInUp}
            >
              <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
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
                  onClick={() => setBillingCycle('yearly')}
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
                key={index}
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
                    Most Popular
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
                      Equivalent to $10/month, billed annually
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
                      key={i}
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
                  onClick={handleNewSnap}
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

      {/* FAQ Section */}
      <motion.section
        id="faq"
        className="relative py-32 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.2,
            },
          },
        }}
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
              Frequently asked questions
            </motion.h2>
            <motion.p
              className="text-xl text-neutral-600 dark:text-neutral-400"
              variants={fadeInUp}
            >
              Everything you need to know about YvCode.
            </motion.p>
          </div>

          <motion.div
            className="space-y-4"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.2,
                },
              },
            }}
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
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
                >
                  <span className="font-semibold text-neutral-900 dark:text-white">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
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

      {/* CTA Section */}
      <motion.section
        className="relative py-32 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2,
            },
          },
        }}
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
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-3xl rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative">
              <motion.h2
                className="text-4xl md:text-5xl font-bold text-white mb-4"
                variants={fadeInUp}
              >
                Ready to create something amazing?
              </motion.h2>
              <motion.p
                className="text-xl text-white/80 mb-8 max-w-2xl mx-auto"
                variants={fadeInUp}
              >
                Start creating beautiful code visuals in seconds. Create your account and start right away.
              </motion.p>
              <motion.button
                onClick={handleNewSnap}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-2xl font-semibold text-lg transition-all"
                variants={fadeInUp}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-5 h-5" />
                Start Creating Now
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>
    </>
  );
}
