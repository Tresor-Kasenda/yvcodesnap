import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeroSection,
  TrustedBySection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  type BillingCycle,
  FaqSection,
  FinalCtaSection,
} from '../components/landing';

export default function LandingPage() {
  const navigate = useNavigate();
  const pricingRef = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const handleStart = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const scrollToPricing = useCallback(() => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleBillingCycleChange = useCallback((cycle: BillingCycle) => {
    setBillingCycle(cycle);
  }, []);

  return (
    <>
      <HeroSection onStart={handleStart} onViewPricing={scrollToPricing} />
      <TrustedBySection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection
        pricingRef={pricingRef}
        billingCycle={billingCycle}
        onBillingCycleChange={handleBillingCycleChange}
        onStart={handleStart}
      />
      <FaqSection />
      <FinalCtaSection onStart={handleStart} onViewPricing={scrollToPricing} />
    </>
  );
}
