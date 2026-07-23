import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/ImagePlaceholder";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  imgQuery: string;
}

const testimonials: Testimonial[] = [
  { quote: "I didn't have to leave my house when I had a fever. The doctor responded in 10 minutes and the medicine was at my door the next day.", name: "Hanna T.", role: "Patient, Dire Dawa", imgQuery: "Ethiopian woman patient headshot, warm smile, casual clothing" },
  { quote: "My mother has diabetes and can't travel easily. The nurse comes to check her vitals every week now. This changed everything for our family.", name: "Dawit M.", role: "Patient's Son, Dire Dawa", imgQuery: "Ethiopian man headshot, professional casual, friendly expression" },
  { quote: "As a doctor, FCN lets me see more patients without the overhead of a full clinic. The platform just works, even on slow connections.", name: "Dr. Sara T.", role: "General Physician", imgQuery: "Ethiopian female doctor headshot, white coat, confident smile" },
  { quote: "The AI symptom checker told me to go to the hospital immediately when I thought it was nothing. It potentially saved my life.", name: "Yonas A.", role: "Patient, Dire Dawa", imgQuery: "Ethiopian man headshot, middle-aged, grateful expression" }
];

export const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const shouldReduceMotion = useReducedMotion();

  const goTo = useCallback((i: number) => {
    const nextIdx = (i + testimonials.length) % testimonials.length;
    setDirection(nextIdx > current ? 1 : -1);
    setCurrent(nextIdx);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;
    intervalRef.current = setInterval(next, 6000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, next, shouldReduceMotion]);

  const t = testimonials[current];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.97
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.97
    })
  };

  return (
    <section className="bg-white py-10 px-4 dark:bg-fcn-dark sm:py-20 sm:px-6">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={!shouldReduceMotion ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">Real Stories, Real Care</h2>
          <p className="mt-2 text-fcn-text-light/60 dark:text-gray-400">Hear from patients who found FCN</p>
        </motion.div>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={shouldReduceMotion ? undefined : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="rounded-2xl border border-fcn-primary/10 bg-white p-5 text-center dark:bg-white/[0.03] sm:p-8"
            >
              <Quote className="mx-auto mb-4 h-8 w-8 text-fcn-accent/40" />
              <blockquote className="mb-6 text-sm italic leading-relaxed text-fcn-text-light dark:text-gray-200 sm:text-lg">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-fcn-accent/30 sm:h-14 sm:w-14">
                <ImagePlaceholder query={t.imgQuery} alt={t.name} aspectRatio="1/1" rounded="full" className="h-full w-full" />
              </div>
              <p className="font-semibold text-fcn-text-light dark:text-white">{t.name}</p>
              <p className="text-sm text-fcn-text-light/50 dark:text-gray-400">{t.role}</p>
              <div className="mt-2 flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-fcn-accent">★</span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.button
            onClick={prev}
            whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            className="absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg transition-shadow hover:shadow-xl dark:bg-[#0D1117] dark:shadow-white/5 sm:-translate-x-4 sm:p-2"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 text-fcn-text-light dark:text-white" />
          </motion.button>
          <motion.button
            onClick={next}
            whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            className="absolute right-0 top-1/2 translate-x-3 -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg transition-shadow hover:shadow-xl dark:bg-[#0D1117] dark:shadow-white/5 sm:translate-x-4 sm:p-2"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 text-fcn-text-light dark:text-white" />
          </motion.button>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => goTo(i)}
                whileHover={shouldReduceMotion ? {} : { scale: 1.3 }}
                className={`h-2.5 rounded-full transition-all ${i === current ? "w-6 bg-fcn-accent" : "w-2.5 bg-fcn-primary/20"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
