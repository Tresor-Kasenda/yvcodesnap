import type {
  OnboardingExperienceLevel,
  OnboardingPlanIntent,
  OnboardingPrimaryFormat,
  OnboardingUseCase,
} from '../types';

type OnboardingOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export const onboardingCopy = {
  title: 'Let us personalize your workspace',
  subtitle: 'A quick onboarding in 5 steps to adapt the experience to your goals.',
  stepLabel: 'Step',
  continueCta: 'Continue',
  backCta: 'Back',
  finishCta: 'Launch editor',
  loadingCta: 'Saving your setup...',
  completedTitle: 'Setup complete',
  completedSubtitle: 'Your workspace is ready. Redirecting to the editor...',
};

export const onboardingOptions: {
  useCases: OnboardingOption<OnboardingUseCase>[];
  experienceLevels: OnboardingOption<OnboardingExperienceLevel>[];
  formats: OnboardingOption<OnboardingPrimaryFormat>[];
  planIntents: OnboardingOption<OnboardingPlanIntent>[];
} = {
  useCases: [
    { value: 'social-content', label: 'Social content', description: 'Create engaging visuals for Instagram, TikTok, X, and LinkedIn.' },
    { value: 'marketing-campaigns', label: 'Marketing campaigns', description: 'Promote offers, launches, and product updates with polished visuals.' },
    { value: 'education-training', label: 'Education and training', description: 'Design clear visual supports for courses, workshops, and tutorials.' },
    { value: 'internal-communication', label: 'Internal communication', description: 'Share clear updates, processes, and playbooks across your team.' },
  ],
  experienceLevels: [
    { value: 'beginner', label: 'Beginner', description: 'I want guided defaults and ready-to-use presets.' },
    { value: 'intermediate', label: 'Intermediate', description: 'I know the basics and want flexible customization.' },
    { value: 'advanced', label: 'Advanced', description: 'I need complete control for high-volume production.' },
  ],
  formats: [
    { value: 'social-posts', label: 'Social posts', description: 'Short, high-impact visuals designed for social platforms.' },
    { value: 'presentations', label: 'Presentations', description: 'Slides and speaking visuals for meetings and events.' },
    { value: 'tutorials', label: 'Tutorials', description: 'Step-by-step visuals for education and content creation.' },
    { value: 'documents', label: 'Documents', description: 'Visual blocks for reports, docs, and guides.' },
    { value: 'ads', label: 'Ads and campaigns', description: 'Creatives optimized for acquisition and promotion.' },
    { value: 'mixed', label: 'Mixed use', description: 'I publish across several formats and channels.' },
  ],
  planIntents: [
    { value: 'free', label: 'Start on free', description: 'Explore the product at no cost and upgrade when ready.' },
    { value: 'pro-trial', label: 'Try Pro', description: 'Unlock advanced exports, brand controls, and premium templates.' },
    { value: 'team', label: 'Team setup', description: 'Set up shared workflows for a collaborative content process.' },
  ],
};
