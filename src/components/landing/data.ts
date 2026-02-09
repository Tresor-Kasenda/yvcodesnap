import { FileText, Palette, Layers, MousePointer2, Download, Share2, Upload, Wand2, Image } from 'lucide-react';
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
    icon: FileText,
    title: 'Start from any content',
    description: 'Paste notes, text, code, or key points and generate a polished visual in seconds.',
    color: 'blue',
  },
  {
    icon: Palette,
    title: 'Design that captures attention',
    description: 'Use gradients, themes, and typography presets that make every visual stand out.',
    color: 'purple',
  },
  {
    icon: Layers,
    title: 'Brand consistency at scale',
    description: 'Save your styles and keep every post aligned with your personal or company identity.',
    color: 'emerald',
  },
  {
    icon: MousePointer2,
    title: 'No design skills required',
    description: 'Drag, resize, and align visually with a fast editor made for any profile.',
    color: 'orange',
  },
  {
    icon: Download,
    title: 'Export for every channel',
    description: 'Download PNG, JPEG, SVG, and 4K assets for social posts, slides, and documents.',
    color: 'pink',
  },
  {
    icon: Share2,
    title: 'Built for growth workflows',
    description: 'Use ready-to-publish sizes for social media, campaigns, newsletters, and internal updates.',
    color: 'cyan',
  },
];

export const howItWorks = [
  {
    step: 1,
    icon: Upload,
    title: 'Add your content',
    description: 'Start from text, ideas, code, screenshots, or draft notes. Everything is editable instantly.',
    color: 'blue',
  },
  {
    step: 2,
    icon: Wand2,
    title: 'Apply your style',
    description: 'Pick theme, spacing, background, and branding so every visual clearly reflects your identity.',
    color: 'purple',
  },
  {
    step: 3,
    icon: Image,
    title: 'Export and distribute',
    description: 'Generate production-ready assets in one click and publish wherever your audience is.',
    color: 'emerald',
  },
];

export const testimonials: Testimonial[] = [
  {
    name: 'Jonathan Yombo',
    role: 'Content Creator',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    quote: 'I publish content much faster now. The workflow is simple and the output looks premium.',
  },
  {
    name: 'Yves Kalume',
    role: 'Growth Marketer',
    image: 'https://randomuser.me/api/portraits/men/6.jpg',
    quote: 'Even without design skills, I can create high-quality visuals that feel professionally crafted.',
  },
  {
    name: 'Yucel Faruksahan',
    role: 'Founder',
    image: 'https://randomuser.me/api/portraits/men/7.jpg',
    quote: 'One of the cleanest tools to present ideas online. Great balance between speed and control.',
  },
  {
    name: 'Shekinah Tshiokufila',
    role: 'Product Manager',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
    quote: 'It helps me keep visual quality high while spending less time polishing screenshots.',
  },
  {
    name: 'Oketa Fred',
    role: 'Freelance Consultant',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    quote: 'The components and presets are practical. I went from idea to publishable image in minutes.',
  },
  {
    name: 'Zeki',
    role: 'Startup Founder',
    image: 'https://randomuser.me/api/portraits/men/5.jpg',
    quote: 'Fast setup, strong customization, and better-looking posts. It has become part of our content stack.',
  },
  {
    name: 'Joseph Kitheka',
    role: 'Marketing Lead',
    image: 'https://randomuser.me/api/portraits/men/9.jpg',
    quote: 'It reduced my production time a lot. I can keep publishing without compromising quality.',
  },
  {
    name: 'Khatab Wedaa',
    role: 'Design Systems Lead',
    image: 'https://randomuser.me/api/portraits/men/10.jpg',
    quote: 'Elegant and responsive. A strong base if you want to launch polished visuals quickly.',
  },
  {
    name: 'Rodrigo Aguilar',
    role: 'Community Manager',
    image: 'https://randomuser.me/api/portraits/men/11.jpg',
    quote: 'Simple, structured, and beautiful. It makes a good-looking result the default outcome.',
  },
  {
    name: 'Eric Ampire',
    role: 'Training Consultant',
    image: 'https://randomuser.me/api/portraits/men/12.jpg',
    quote: 'A practical way to create strong visuals without investing hours in design tools.',
  },
  {
    name: 'Roland Tubonge',
    role: 'Operations Manager',
    image: 'https://randomuser.me/api/portraits/men/13.jpg',
    quote: 'The learning curve is near zero. You can ship impressive visuals from day one.',
  },
  {
    name: 'Anonymous Author',
    role: 'Course Creator',
    image: 'https://randomuser.me/api/portraits/men/8.jpg',
    quote: 'I needed a way to publish clear training visuals quickly. This solved that problem immediately.',
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Best to test your workflow and publish your first visuals',
    features: [
      'Up to 2 cloud snapshots',
      '20+ design themes',
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
    question: 'What type of content can I create?',
    answer: 'You can design social posts, slides, tutorials, promotional visuals, and internal communication assets.',
  },
  {
    question: 'Do you store my content?',
    answer: 'No. Editing happens in your browser. Your content stays on your device unless you choose to export or sync it.',
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
