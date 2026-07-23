import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { Activity, Brain, ChevronDown, FileHeart, Hospital, Pill, Video } from "lucide-react";

const features = [
  { icon: Video, title: "Remote Consultation", body: "Connect with licensed doctors via text, voice, or video — no waiting room required." },
  { icon: Activity, title: "Nurse Home Visits", body: "Can't make it to a lab? Our nurses come to you for sample collection and vitals recording." },
  { icon: Pill, title: "E-Prescriptions", body: "Doctors issue digital prescriptions instantly. Scan your QR code at any partner pharmacy." },
  { icon: Brain, title: "AI Symptom Checker", body: "Describe your symptoms and get instant AI-powered guidance on urgency and next steps." },
  { icon: FileHeart, title: "Digital Health Records", body: "Your complete medical history, vitals, and prescriptions in one secure place — always accessible." },
  { icon: Hospital, title: "Hospital Checker", body: "See real-time hospital occupancy before you travel. Know before you go." }
];

export const FeaturesSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  return (
    <section ref={ref} id="features" className="scroll-mt-20 py-10 px-4 sm:py-20 sm:px-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10 text-center sm:mb-14"
        >
          <h2 className="text-2xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">Everything You Need, One Platform</h2>
          <p className="mt-2 text-sm text-fcn-text-light/60 dark:text-gray-400 sm:text-base">From symptom check to medication delivery — FCN handles your complete healthcare journey</p>
        </motion.div>

        {/* Mobile: accordion list */}
        <div className="sm:hidden">
          <motion.div
            variants={shouldReduceMotion ? undefined : containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="space-y-2"
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              const isOpen = openIdx === i;
              return (
                <motion.div key={f.title} variants={shouldReduceMotion ? undefined : itemVariants}>
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                      isOpen
                        ? "border-fcn-accent/30 bg-fcn-accent/[0.04]"
                        : "border-fcn-primary/10 bg-white dark:bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: isOpen ? "hsla(172, 67%, 45%, 0.15)" : "hsla(172, 67%, 45%, 0.08)" }}
                    >
                      <Icon className="h-4 w-4 text-fcn-primary dark:text-fcn-accent" />
                    </div>
                    <span className={`flex-1 text-sm font-medium ${isOpen ? "text-fcn-accent" : "text-fcn-text-light dark:text-white"}`}>
                      {f.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-4 w-4 text-fcn-primary/40 dark:text-fcn-accent/40" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 text-xs leading-relaxed text-fcn-text-light/60 dark:text-gray-400">
                          {f.body}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Tablet/Desktop: card grid */}
        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="hidden grid-cols-2 gap-3 sm:grid sm:gap-6 lg:grid-cols-3"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={shouldReduceMotion ? undefined : itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -8, boxShadow: "0 20px 40px rgba(10,126,164,0.15)" }}
                className="group rounded-2xl border border-fcn-primary/10 bg-white p-4 transition-shadow dark:bg-white/[0.03] sm:p-6"
              >
                <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-fcn-primary/15 to-fcn-accent/15 p-2 sm:mb-4 sm:p-3">
                  <Icon className="h-5 w-5 text-fcn-primary sm:h-6 sm:w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-fcn-text-light dark:text-white sm:mb-2 sm:text-lg">{f.title}</h3>
                <p className="text-xs leading-relaxed text-fcn-text-light/60 dark:text-gray-400 sm:text-sm">{f.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
