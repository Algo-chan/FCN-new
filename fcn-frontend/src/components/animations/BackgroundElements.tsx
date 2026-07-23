import { useReducedMotion } from "motion/react";

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  type: "cross" | "circle" | "blob";
  delay: number;
  duration: number;
}

const elements: FloatingElement[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 10 + Math.random() * 20,
  type: (["cross", "circle", "blob"] as const)[i % 3],
  delay: Math.random() * 10,
  duration: 20 + Math.random() * 20
}));

export const BackgroundElements = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {elements.map((el) => {
        if (el.type === "cross") {
          return (
            <div
              key={el.id}
              className="absolute opacity-[0.04]"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: el.size,
                height: el.size,
                animation: `float-gentle ${el.duration}s ease-in-out ${el.delay}s infinite`
              }}
            >
              <div className="medical-cross text-fcn-accent" />
            </div>
          );
        }

        if (el.type === "circle") {
          return (
            <div
              key={el.id}
              className="absolute rounded-full border border-fcn-accent/[0.06]"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: el.size * 2,
                height: el.size * 2,
                animation: `float-drift ${el.duration}s ease-in-out ${el.delay}s infinite`
              }}
            />
          );
        }

        return (
          <div
            key={el.id}
            className="absolute rounded-full bg-fcn-accent/[0.03] blur-xl"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: el.size * 3,
              height: el.size * 3,
              animation: `float-blob ${el.duration}s ease-in-out ${el.delay}s infinite`
            }}
          />
        );
      })}
    </div>
  );
};
