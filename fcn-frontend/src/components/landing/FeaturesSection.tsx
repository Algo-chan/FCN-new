import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Activity, Brain, FileHeart, Hospital, Pill, Video } from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  body: string;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, body, delay }: FeatureCardProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: shouldReduceMotion ? 0 : delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={shouldReduceMotion ? {} : { y: -8, boxShadow: "0 20px 40px rgba(10,126,164,0.15)" }}
      className="group cursor-default rounded-2xl border border-fcn-primary/10 bg-white p-4 transition-shadow dark:bg-white/[0.03] sm:p-6"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: shouldReduceMotion ? 0 : delay + 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-fcn-primary/15 to-fcn-accent/15 p-2 sm:mb-4 sm:p-3"
      >
        <Icon className="h-5 w-5 text-fcn-primary sm:h-6 sm:w-6" />
      </motion.div>
      <h3 className="mb-1 text-sm font-semibold text-fcn-text-light dark:text-white sm:mb-2 sm:text-lg">{title}</h3>
      <p className="text-xs leading-relaxed text-fcn-text-light/60 dark:text-gray-400 sm:text-sm">{body}</p>
    </motion.div>
  );
};

export const FeaturesSection = () => {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const features = [
    { icon: Video, title: "Remote Consultation", body: "Connect with licensed doctors via text, voice, or video — no waiting room required." },
    { icon: Activity, title: "Nurse Home Visits", body: "Can't make it to a lab? Our nurses come to you for sample collection and vitals recording." },
    { icon: Pill, title: "E-Prescriptions", body: "Doctors issue digital prescriptions instantly. Scan your QR code at any partner pharmacy." },
    { icon: Brain, title: "AI Symptom Checker", body: "Describe your symptoms and get instant AI-powered guidance on urgency and next steps." },
    { icon: FileHeart, title: "Digital Health Records", body: "Your complete medical history, vitals, and prescriptions in one secure place — always accessible." },
    { icon: Hospital, title: "Hospital Checker", body: "See real-time hospital occupancy before you travel. Know before you go." }
  ];

  return (
    <section ref={ref} id="features" className="scroll-mt-20 py-10 px-4 sm:py-20 sm:px-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2 className="text-2xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">Everything You Need, One Platform</h2>
          <p className="mt-2 text-sm text-fcn-text-light/60 dark:text-gray-400 sm:text-base">From symptom check to medication delivery — FCN handles your complete healthcare journey</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
};
