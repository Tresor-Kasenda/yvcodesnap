import { Code, Palette, Layers, MousePointer2, Download, Share2, Upload, Wand2, Image } from 'lucide-react';
import { trustedCompanies } from '../../content/product';

export type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
};

export type PricingPlan = {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

export const users = [
  { name: 'Alex', avatar: 'https://i.pravatar.cc/150?img=1' },
  { name: 'Sarah', avatar: 'https://i.pravatar.cc/150?img=5' },
  { name: 'Marcus', avatar: 'https://i.pravatar.cc/150?img=8' },
  { name: 'Elena', avatar: 'https://i.pravatar.cc/150?img=9' },
  { name: 'James', avatar: 'https://i.pravatar.cc/150?img=12' },
  { name: 'Priya', avatar: 'https://i.pravatar.cc/150?img=16' },
  { name: 'David', avatar: 'https://i.pravatar.cc/150?img=11' },
];

export const trustedBy = trustedCompanies;

export const features = [
  {
    icon: Code,
    title: 'Paste and publish in seconds',
    description: 'Drop any snippet and get a polished visual instantly with clean defaults.',
    color: 'blue',
  },
  {
    icon: Palette,
    title: 'Design that drives clicks',
    description: 'Use gradients, themes, and typography presets made for social engagement.',
    color: 'purple',
  },
  {
    icon: Layers,
    title: 'Brand consistency at scale',
    description: 'Save styles and keep every post aligned with your personal or company brand.',
    color: 'emerald',
  },
  {
    icon: MousePointer2,
    title: 'No design skills required',
    description: 'Drag, resize, and align visually with a fast editor built for developers.',
    color: 'orange',
  },
  {
    icon: Download,
    title: 'Export for every use case',
    description: 'Download PNG, JPEG, SVG, and 4K assets for docs, social, and slides.',
    color: 'pink',
  },
  {
    icon: Share2,
    title: 'Built for growth loops',
    description: 'Use channel-ready sizes for X, LinkedIn, blog posts, and newsletters.',
    color: 'cyan',
  },
];

export const howItWorks = [
  {
    step: 1,
    icon: Upload,
    title: 'Paste your code',
    description: 'Start from a snippet, gist, or your editor output. Language detection is automatic.',
    color: 'blue',
  },
  {
    step: 2,
    icon: Wand2,
    title: 'Apply your style',
    description: 'Pick theme, spacing, background, and branding so your posts look unmistakably yours.',
    color: 'purple',
  },
  {
    step: 3,
    icon: Image,
    title: 'Export and distribute',
    description: 'Ship production-ready visuals in one click and publish wherever your audience is.',
    color: 'emerald',
  },
];

export const testimonials: Testimonial[] = [
  {
    name: 'Jonathan Yombo',
    role: 'Software Engineer',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    quote: 'I publish code examples faster now. The workflow is simple and the output looks premium.',
  },
  {
    name: 'Yves Kalume',
    role: 'GDE - Android',
    image: 'https://randomuser.me/api/portraits/men/6.jpg',
    quote: 'Even without design skills, I can ship high-quality visuals that look professionally crafted.',
  },
  {
    name: 'Yucel Faruksahan',
    role: 'Tailkits Creator',
    image: 'https://randomuser.me/api/portraits/men/7.jpg',
    quote: 'One of the cleanest tools to showcase code online. Great balance between speed and control.',
  },
  {
    name: 'Shekinah Tshiokufila',
    role: 'Senior Software Engineer',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
    quote: 'It helps me keep visual quality high while spending less time polishing screenshots.',
  },
  {
    name: 'Oketa Fred',
    role: 'Fullstack Developer',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    quote: 'The components and presets are practical. I went from idea to publishable image in minutes.',
  },
  {
    name: 'Zeki',
    role: 'Founder of ChatExtend',
    image: 'https://randomuser.me/api/portraits/men/5.jpg',
    quote: 'Fast setup, strong customization, and better-looking posts. It has become part of our content stack.',
  },
  {
    name: 'Joseph Kitheka',
    role: 'Fullstack Developer',
    image: 'https://randomuser.me/api/portraits/men/9.jpg',
    quote: 'It reduced my production time a lot. I can keep publishing without compromising quality.',
  },
  {
    name: 'Khatab Wedaa',
    role: 'MerakiUI Creator',
    image: 'https://randomuser.me/api/portraits/men/10.jpg',
    quote: 'Elegant and responsive. A strong base if you want to launch polished visuals quickly.',
  },
  {
    name: 'Rodrigo Aguilar',
    role: 'TailwindAwesome Creator',
    image: 'https://randomuser.me/api/portraits/men/11.jpg',
    quote: 'Simple, structured, and beautiful. It makes a good-looking result the default outcome.',
  },
  {
    name: 'Eric Ampire',
    role: 'Mobile Engineer and Android GDE',
    image: 'https://randomuser.me/api/portraits/men/12.jpg',
    quote: 'A practical way to create strong visuals without investing hours in design tools.',
  },
  {
    name: 'Roland Tubonge',
    role: 'Software Engineer',
    image: 'https://randomuser.me/api/portraits/men/13.jpg',
    quote: 'The learning curve is near zero. You can ship impressive visuals from day one.',
  },
  {
    name: 'Anonymous Author',
    role: 'Technical Writer',
    image: 'https://randomuser.me/api/portraits/men/8.jpg',
    quote: 'I needed a way to publish clean tutorial visuals fast. This solved that problem immediately.',
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Best to test the workflow and ship your first visuals',
    features: [
      'Unlimited snapshots',
      '20+ syntax themes',
      'PNG and JPEG export',
      'Basic backgrounds',
      'Community templates',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 12,
    yearlyPrice: 120,
    description: 'Built for creators and teams publishing every week',
    features: [
      'Everything in Free',
      'SVG and 4K export',
      'Custom branding and presets',
      'Premium templates',
      'No watermark',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
];

export const faqs = [
  {
    question: 'Can I start without a credit card?',
    answer: 'Yes. You can use the Free plan immediately and create your first visuals before paying anything.',
  },
  {
    question: 'When should I upgrade to Pro?',
    answer: 'Upgrade when publishing consistently, needing brand control, or requiring SVG and 4K exports for professional channels.',
  },
  {
    question: 'What languages are supported?',
    answer: 'More than 50 languages, including JavaScript, TypeScript, Python, Go, Rust, Java, C++, Swift, and Kotlin.',
  },
  {
    question: 'Do you store my code?',
    answer: 'No. Editing happens in your browser. Your snippets stay on your device unless you choose to export or share.',
  },
  {
    question: 'Can I cancel Pro anytime?',
    answer: 'Yes. You can switch plans based on your publishing cadence and keep using the Free tier whenever needed.',
  },
  {
    question: 'Can I use exports for commercial projects?',
    answer: 'Yes. The assets you generate are yours to use in social posts, docs, courses, and client deliverables.',
  },
];
