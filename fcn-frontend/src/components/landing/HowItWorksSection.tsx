import { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { animate } from "animejs";
import { FileText, MessageCircle, Pill, Smartphone, Stethoscope, TestTube, UserCheck } from "lucide-react";

const steps = [
  { icon: Smartphone, title: "Open FCN", desc: "Login or create your free account" },
  { icon: Stethoscope, title: "Book Doctor", desc: "Browse and book a doctor that fits your needs" },
  { icon: MessageCircle, title: "Consult", desc: "Chat, call, or video with your doctor remotely" },
  { icon: UserCheck, title: "Nurse Sent", desc: "If needed, a nurse visits your home for tests" },
  { icon: TestTube, title: "Lab Tests", desc: "Samples are processed at our partner labs" },
  { icon: FileText, title: "E-Prescription", desc: "Receive your digital prescription instantly" },
  { icon: Pill, title: "Get Meds", desc: "Collect medication at any partner pharmacy" }
];

export const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-120px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !lineRef.current || !isInView) return;

    const path = lineRef.current;
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    animate(path, {
      strokeDashoffset: [length, 0],
      duration: 1500,
      easing: "easeInOut"
    });
  }, [shouldReduceMotion, isInView]);

  return (
    <section ref={sectionRef} id="how-it-works" className="scroll-mt-20 py-10 px-4 sm:py-20 sm:px-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2 className="text-2xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">How FCN Works</h2>
          <p className="mt-2 text-fcn-text-light/60 dark:text-gray-400">From home to healed, in 7 simple steps</p>
        </motion.div>

        {/* Desktop horizontal flow */}
        <div className="relative hidden lg:block">
          <svg className="absolute left-0 top-8 w-full" height="4" viewBox="0 0 1200 4" preserveAspectRatio="none">
            <path ref={lineRef} d="M0,2 L1200,2" fill="none" stroke="#0A7EA4" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="relative grid grid-cols-7 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: shouldReduceMotion ? 0 : i * 0.08, duration: 0.4 }}
                className="text-center"
              >
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-500 ${isInView ? "border-fcn-primary bg-fcn-primary text-white shadow-[0_0_20px_rgba(10,126,164,0.3)]" : "border-gray-600 text-gray-500"}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-fcn-text-light dark:text-white">{step.title}</p>
                <p className="mt-1 text-xs text-fcn-text-light/50 dark:text-gray-500">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile vertical stack */}
        <div className="space-y-4 lg:hidden">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.06, duration: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-fcn-primary bg-fcn-primary/10 text-fcn-primary sm:h-12 sm:w-12">
                <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="font-semibold text-fcn-text-light dark:text-white">{step.title}</p>
                <p className="text-xs text-fcn-text-light/60 dark:text-gray-400 sm:text-sm">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
