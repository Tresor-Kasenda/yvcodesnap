import { useState } from 'react';
import { X, Check, Zap } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSnaps?: number;
    maxSnaps?: number;
}

export default function UpgradeModal({
                                         isOpen,
                                         onClose,
                                         currentSnaps = 0,
                                         maxSnaps = 2,
                                     }: UpgradeModalProps) {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

    if (!isOpen) return null;

    const monthlyPrice = 8;
    const annualPrice = 90;
    const monthlyAnnual = (annualPrice / 12).toFixed(2);
    const savings = (((monthlyPrice * 12) - annualPrice) / (monthlyPrice * 12) * 100).toFixed(0);

    const allFeatures = [
        { name: `${maxSnaps} cloud snaps / Unlimited`, free: true, pro: true },
        { name: 'PNG/JPEG export', free: true, pro: true },
        { name: '4K export', free: false, pro: true },
        { name: 'Basic support / Priority support', free: true, pro: true },
        { name: 'Advanced sharing options', free: false, pro: true },
        { name: 'Custom branding', free: false, pro: true },
        { name: 'API access (future)', free: false, pro: true },
    ];

    const handleUpgrade = () => {
        // TODO: Integrate Stripe checkout
        console.log(`Upgrade to Pro - ${billingPeriod}`);
        alert(`Redirect to Stripe checkout for ${billingPeriod} billing\n\nPrice: ${billingPeriod === 'monthly' ? '$8/month' : '$90/year'}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="overflow-auto max-h-[90vh]">
                    {/* Header */}
                    <div className="bg-linear-to-r from-blue-600 to-cyan-600 px-8 py-12 text-white text-center">
                        <h2 className="text-4xl font-bold mb-2">Upgrade to Pro</h2>
                        <p className="text-lg opacity-90">Unlock unlimited snaps and premium features</p>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-12">
                        {/* Current Usage */}
                        {currentSnaps !== undefined && maxSnaps !== undefined && (
                            <div className="mb-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    You're using <span className="font-bold">{currentSnaps} of {maxSnaps}</span> free snaps. Upgrade to save unlimited snaps!
                                </p>
                            </div>
                        )}

                        {/* Billing Toggle */}
                        <div className="flex justify-center mb-12">
                            <div className="inline-flex bg-neutral-200 dark:bg-neutral-800 rounded-lg p-1">
                                <button
                                    onClick={() => setBillingPeriod('monthly')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                                        billingPeriod === 'monthly'
                                            ? 'bg-white dark:bg-neutral-900 text-blue-600 shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingPeriod('annual')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all relative ${
                                        billingPeriod === 'annual'
                                            ? 'bg-white dark:bg-neutral-900 text-blue-600 shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    Annual
                                    <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                        Save {savings}%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            {/* Free Plan */}
                            <div className="border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
                                <h3 className="text-2xl font-bold mb-2">Free</h3>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-6">Perfect for getting started</p>

                                <div className="mb-6">
                                    <div className="text-3xl font-bold">${0}</div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Forever free</p>
                                </div>

                                <button
                                    disabled
                                    className="w-full py-3 rounded-lg border-2 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium mb-8 cursor-not-allowed opacity-50"
                                >
                                    Current Plan
                                </button>

                                <div className="space-y-4">
                                    {allFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            {feature.free ? (
                                                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 rounded shrink-0 mt-0.5" />
                                            )}
                                            <span
                                                className={
                                                    feature.free
                                                        ? 'text-neutral-900 dark:text-white'
                                                        : 'text-neutral-500 dark:text-neutral-500 line-through'
                                                }
                                            >
                                                {feature.name.split(' / ')[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pro Plan */}
                            <div className="border-2 border-blue-600 rounded-2xl p-8 bg-blue-50/50 dark:bg-blue-900/10 relative">
                                <div className="absolute -top-4 left-8 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Most Popular
                                </div>

                                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-6">For serious creators</p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-3xl font-bold">
                                            ${billingPeriod === 'monthly' ? monthlyPrice : annualPrice}
                                        </div>
                                        <div className="text-neutral-600 dark:text-neutral-400">
                                            {billingPeriod === 'monthly' ? '/month' : '/year'}
                                        </div>
                                    </div>
                                    {billingPeriod === 'annual' && (
                                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                            ${monthlyAnnual} per month (Save ${(monthlyPrice * 12 - annualPrice).toFixed(0)}/year)
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleUpgrade}
                                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium mb-8 transition-colors active:scale-95"
                                >
                                    Upgrade Now
                                </button>

                                <div className="space-y-4">
                                    {allFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                            <span className="text-neutral-900 dark:text-white">
                                                {feature.name.split(' / ')[1] || feature.name.split(' / ')[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* FAQ */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-8 mb-8">
                            <h3 className="text-xl font-bold mb-6">Frequently Asked Questions</h3>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold mb-2 text-neutral-900 dark:text-white">Can I change my plan?</h4>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2 text-neutral-900 dark:text-white">Do you offer refunds?</h4>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        If you're not satisfied, contact us within 7 days for a full refund. No questions asked.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2 text-neutral-900 dark:text-white">What payment methods do you accept?</h4>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        We accept all major credit cards, Apple Pay, and Google Pay through Stripe.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2 text-neutral-900 dark:text-white">Is there a student discount?</h4>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        Yes! Students get 50% off Pro. Email us with a valid .edu email for verification.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="text-center">
                            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                                Questions? <a href="mailto:support@yvcode.app" className="text-blue-600 hover:underline">Contact support</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
