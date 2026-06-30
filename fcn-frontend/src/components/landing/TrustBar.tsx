import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { ImagePlaceholder } from "@/components/landing/ImagePlaceholder";

const partners = [
  { name: "Dire Dawa General Hospital", query: "Dire Dawa General Hospital exterior, modern East African hospital architecture" },
  { name: "Haramaya University Hospital", query: "Haramaya University teaching hospital entrance" },
  { name: "Dil-Chora Referral Hospital", query: "Dil-Chora Referral Hospital building, Dire Dawa" },
  { name: "Ethiopian Medical Association", query: "Ethiopian Medical Association office building logo" },
  { name: "Ministry of Health Ethiopia", query: "Ethiopian Ministry of Health official building" }
];

export const TrustBar = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="border-y border-white/5 bg-white/30 py-10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-8 text-center text-sm font-medium text-fcn-text-light/50 dark:text-gray-400"
        >
          Trusted by leading healthcare institutions in Dire Dawa
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition hover:opacity-100">
          {partners.map((p, i) => (
            <motion.div
              key={p.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.08 }}
              className="h-10 w-32 grayscale transition hover:grayscale-0"
            >
              <ImagePlaceholder query={p.query} alt={`${p.name} logo`} aspectRatio="3/1" rounded="md" className="h-full w-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};