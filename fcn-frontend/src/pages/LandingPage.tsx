import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { PageTransition } from "@/components/animations/PageTransition";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ForHospitalsSection } from "@/components/landing/ForHospitalsSection";
import { ForDoctorsSection } from "@/components/landing/ForDoctorsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { Footer } from "@/components/landing/Footer";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      // All GSAP animations are handled within individual section components
      // This ensures proper cleanup on unmount
    }, pageRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [shouldReduceMotion]);

  return (
    <PageTransition>
      <div ref={pageRef} className="min-h-screen bg-fcn-light text-fcn-text-light dark:bg-fcn-dark dark:text-fcn-text-dark">
        <Navbar />
        <HeroSection />
        <TrustBar />
        <FeaturesSection />
        <HowItWorksSection />
        <ForHospitalsSection />
        <ForDoctorsSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
        <Footer />
      </div>
    </PageTransition>
  );
};

export default LandingPage;