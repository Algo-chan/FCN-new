import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  { q: "Is FCN available outside Dire Dawa?", a: "FCN is currently piloting in Dire Dawa, Ethiopia. We plan to expand to additional cities based on pilot success and partner hospital availability." },
  { q: "How much does a consultation cost?", a: "Standard remote consultations start at 50 ETB. Pricing may vary by doctor specialty and appointment type. Exact fees are always shown before you confirm a booking." },
  { q: "Is my health data safe?", a: "Yes. All consultation messages are encrypted, and your health records are only accessible to you and the doctors actively treating you. We never share your data with third parties." },
  { q: "What if I don't have a smartphone?", a: "FCN currently requires an Android smartphone with internet access. We're exploring SMS and USSD support for feature phones in future phases." },
  { q: "Can I get a nurse to visit my home?", a: "Yes — if your doctor determines you need lab testing or vitals recorded in person, you can request a nurse home visit directly through the platform." },
  { q: "Is the AI symptom checker a replacement for seeing a doctor?", a: "No. The AI Symptom Checker provides guidance only and is not a medical diagnosis. It helps you understand urgency and prepares you for your doctor consultation." }
];

export const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const toggle = (i: number) => setOpenIdx(openIdx === i ? null : i);

  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={!shouldReduceMotion ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-fcn-text-light dark:text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-fcn-text-light/60 dark:text-gray-400">Everything you need to know about FCN</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={!shouldReduceMotion ? { opacity: 0, y: 10 } : undefined}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.05 }}
              className={`overflow-hidden rounded-xl border transition-colors ${openIdx === i ? "border-fcn-accent/40 bg-fcn-accent/[0.02]" : "border-fcn-primary/10 bg-white dark:bg-white/[0.03]"}`}
            >
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                aria-expanded={openIdx === i}
              >
                <span className="pr-4 text-sm font-medium text-fcn-text-light dark:text-white">{faq.q}</span>
                <motion.span
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="h-4 w-4 text-fcn-accent" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    initial={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={!shouldReduceMotion ? { height: 0, opacity: 0 } : undefined}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-fcn-accent/10 px-5 py-4 text-sm leading-relaxed text-fcn-text-light/70 dark:text-gray-400">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};