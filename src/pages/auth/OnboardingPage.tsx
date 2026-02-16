import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Zap } from 'lucide-react';
import { onboardingCopy, onboardingOptions } from '../../content/onboarding';
import { productBrand } from '../../content/product';
import { useAuthStore } from '../../store/authStore';
import type { OnboardingPreferences } from '../../types';

const TOTAL_STEPS = 5;

type OptionStepContent = {
    type: 'options';
    title: string;
    subtitle: string;
    options: Array<{ value: string; label: string; description: string }>;
    selectedValue: string | null;
    onSelect: (value: string) => void;
};

type InputStepContent = {
    type: 'input';
    title: string;
    subtitle: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
};

type StepContent = OptionStepContent | InputStepContent;

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { user, profile, hasCompletedOnboarding, completeOnboarding } = useAuthStore();

    const [stepIndex, setStepIndex] = useState(0);
    const [fullName, setFullName] = useState('');
    const [useCase, setUseCase] = useState<OnboardingPreferences['useCase'] | null>(null);
    const [experienceLevel, setExperienceLevel] = useState<OnboardingPreferences['experienceLevel'] | null>(null);
    const [primaryFormat, setPrimaryFormat] = useState<OnboardingPreferences['primaryFormat'] | null>(null);
    const [planIntent, setPlanIntent] = useState<OnboardingPreferences['planIntent'] | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        html.classList.add('auth-scrollbar');
        body.classList.add('auth-scrollbar');

        return () => {
            html.classList.remove('auth-scrollbar');
            body.classList.remove('auth-scrollbar');
        };
    }, []);

    useEffect(() => {
        if (fullName.trim().length > 0) {
            return;
        }

        const profileName = profile?.full_name?.trim() ?? '';
        const metadataName = typeof user?.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name.trim()
            : '';

        const initialName = profileName || metadataName;
        if (initialName) {
            setFullName(initialName);
        }
    }, [fullName, profile?.full_name, user]);

    const stepContent = useMemo<StepContent>(() => {
        if (stepIndex === 0) {
            return {
                type: 'input',
                title: 'What is your name?',
                subtitle: 'Your workspace will use it in greetings and shared exports.',
                label: 'Full name',
                placeholder: 'e.g. Maria Johnson',
                value: fullName,
                onChange: setFullName,
            };
        }

        if (stepIndex === 1) {
            return {
                type: 'options',
                title: 'What type of content do you create most?',
                subtitle: 'We will adapt your default workspace to match this workflow.',
                options: onboardingOptions.useCases,
                selectedValue: useCase,
                onSelect: (value: string) => setUseCase(value as OnboardingPreferences['useCase']),
            };
        }

        if (stepIndex === 2) {
            return {
                type: 'options',
                title: 'What is your current level?',
                subtitle: 'This helps us choose the right balance between guidance and flexibility.',
                options: onboardingOptions.experienceLevels,
                selectedValue: experienceLevel,
                onSelect: (value: string) => setExperienceLevel(value as OnboardingPreferences['experienceLevel']),
            };
        }

        if (stepIndex === 3) {
            return {
                type: 'options',
                title: 'What format do you publish most?',
                subtitle: 'We prioritize templates and presets for your main output format.',
                options: onboardingOptions.formats,
                selectedValue: primaryFormat,
                onSelect: (value: string) => setPrimaryFormat(value as OnboardingPreferences['primaryFormat']),
            };
        }

        return {
            type: 'options',
            title: 'How do you want to start?',
            subtitle: 'Pick your preferred path and we will personalize your workspace.',
            options: onboardingOptions.planIntents,
            selectedValue: planIntent,
            onSelect: (value: string) => setPlanIntent(value as OnboardingPreferences['planIntent']),
        };
    }, [stepIndex, fullName, useCase, experienceLevel, primaryFormat, planIntent]);

    const canContinue = stepContent.type === 'input'
        ? stepContent.value.trim().length >= 2
        : Boolean(stepContent.selectedValue);

    const handleBack = () => {
        setError('');
        if (stepIndex > 0) {
            setStepIndex((prev) => prev - 1);
        }
    };

    const handleContinue = async () => {
        setError('');
        if (saving) {
            return;
        }

        if (!canContinue) {
            if (stepContent.type === 'input') {
                setError('Please enter your name to continue.');
            }
            return;
        }

        if (stepIndex < TOTAL_STEPS - 1) {
            setStepIndex((prev) => prev + 1);
            return;
        }

        if (!fullName || !useCase || !experienceLevel || !primaryFormat || !planIntent) {
            setError('Please complete every step before continuing.');
            return;
        }

        setSaving(true);
        const result = await completeOnboarding({
            fullName: fullName.trim(),
            useCase,
            experienceLevel,
            primaryFormat,
            planIntent,
        });

        if (result.error) {
            setError(result.error);
            setSaving(false);
            return;
        }

        setCompleted(true);
        navigate('/editor', { replace: true });
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (hasCompletedOnboarding) {
        return <Navigate to="/editor" replace />;
    }

    if (completed) {
        return (
            <div className="h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-white flex items-center justify-center px-6">
                <div className="max-w-md w-full rounded-3xl border border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-white/5 backdrop-blur-xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 mx-auto flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold">{onboardingCopy.completedTitle}</h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{onboardingCopy.completedSubtitle}</p>
                </div>
            </div>
        );
    }

    const progress = ((stepIndex + 1) / TOTAL_STEPS) * 100;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-white relative overflow-hidden px-4 sm:px-6 py-6">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-blue-500/15 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[520px] h-[360px] bg-violet-500/12 blur-[130px] rounded-full pointer-events-none" />

            <div className="relative max-w-3xl mx-auto">
                <header className="mb-8 flex flex-col gap-4">
                    <Link to="/" className="inline-flex items-center gap-3 group w-fit">
                        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </span>
                        <span className="leading-tight">
                            <span className="block font-bold text-lg tracking-tight text-neutral-900 dark:text-white">{productBrand.name}</span>
                            <span className="block text-xs text-neutral-500 dark:text-neutral-400">{productBrand.platformTagline}</span>
                        </span>
                    </Link>

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{onboardingCopy.title}</h1>
                        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{onboardingCopy.subtitle}</p>
                    </div>
                </header>

                <section className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8">
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-neutral-500 dark:text-neutral-400">
                            {onboardingCopy.stepLabel} {stepIndex + 1} / {TOTAL_STEPS}
                        </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 mb-6 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-blue-600 to-violet-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold">{stepContent.title}</h2>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{stepContent.subtitle}</p>
                    </div>

                    {stepContent.type === 'input' ? (
                        <div className="mt-6">
                            <label htmlFor="onboarding-full-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {stepContent.label}
                            </label>
                            <input
                                id="onboarding-full-name"
                                type="text"
                                value={stepContent.value}
                                onChange={(event) => stepContent.onChange(event.target.value)}
                                placeholder={stepContent.placeholder}
                                autoComplete="name"
                                maxLength={80}
                                className="mt-2 w-full rounded-2xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-neutral-900/60 px-4 py-3 text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                            />
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {stepContent.options.map((option) => {
                                const selected = option.value === stepContent.selectedValue;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => stepContent.onSelect(option.value)}
                                        className={`text-left rounded-2xl border px-4 py-4 transition-all ${
                                            selected
                                                ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-500/10'
                                                : 'border-neutral-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/40'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-sm sm:text-base">
                                                    {option.label}
                                                </h3>
                                                <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                                                    {option.description}
                                                </p>
                                            </div>
                                            {selected && (
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white inline-flex items-center justify-center shrink-0">
                                                    <Check className="w-4 h-4" />
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {error && (
                        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                            {error}
                        </p>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={stepIndex === 0 || saving}
                            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {onboardingCopy.backCta}
                        </button>
                        <button
                            type="button"
                            onClick={handleContinue}
                            disabled={!canContinue || saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving
                                ? onboardingCopy.loadingCta
                                : stepIndex === TOTAL_STEPS - 1
                                    ? onboardingCopy.finishCta
                                    : onboardingCopy.continueCta}
                            {!saving && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
