import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { LoadingScreen } from "@/components/animations/LoadingScreen";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ForHospitalsSection } from "@/components/landing/ForHospitalsSection";
import { ForDoctorsSection } from "@/components/landing/ForDoctorsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  const [loading, setLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      <div className={`min-h-screen bg-fcn-light text-fcn-text-light transition-opacity duration-500 dark:bg-fcn-dark dark:text-fcn-text-dark ${loading ? "overflow-hidden h-screen" : ""}`}>
        <Navbar />

        {/* Hero — pinned behind, sticky */}
        <HeroSection />

        {/* All sections slide OVER the hero */}
        <div className="relative z-10">
          <TrustBar />
          <StatsSection />
          <FeaturesSection />
          <HowItWorksSection />
          <ForHospitalsSection />
          <ForDoctorsSection />
          <TestimonialsSection />
          <FAQSection />
          <FinalCTASection />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default LandingPage;
