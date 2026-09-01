'use client';

import { useEffect } from 'react';
import LandingNavbar from './LandingNavbar';
import HeroSection from './HeroSection';
import CategoriesSection from './CategoriesSection';
import HowItWorksSection from './HowItWorksSection';
import TrendingSection from './TrendingSection';
import WhyRentSection from './WhyRentSection';
import TrustSection from './TrustSection';
import ReviewsSection from './ReviewsSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';

export default function LandingPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <main className="scroll-smooth">
      <LandingNavbar />
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
      <TrendingSection />
      <WhyRentSection />
      <TrustSection />
      <ReviewsSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}
