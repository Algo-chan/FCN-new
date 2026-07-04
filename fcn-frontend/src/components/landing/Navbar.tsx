import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "For Hospitals", href: "#for-hospitals" },
  { label: "For Doctors", href: "#for-doctors" },
  { label: "FAQ", href: "#faq" }
];

const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  e.preventDefault();
  const id = href.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export const Navbar = () => {
  const scrollY = useScrollPosition();
  const { isDark, toggleTheme } = useTheme();
  const { playTransition } = useSound();
  const shouldReduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrolled = scrollY > 50;

  const bgClasses = scrolled
    ? "bg-white/90 dark:bg-[#0D1117]/90 backdrop-blur-lg shadow-sm"
    : "bg-transparent";

  const textClasses = scrolled
    ? "text-fcn-text-light dark:text-fcn-text-dark"
    : "text-white";

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClasses}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo/fcn-logo-full.png"
            alt="FCN Logo"
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`text-sm font-medium transition hover:text-fcn-accent ${textClasses}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`rounded-full p-2 transition hover:bg-white/10 ${textClasses}`}
            aria-label="Toggle theme"
          >
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={!shouldReduceMotion ? { rotate: -90, opacity: 0 } : undefined}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" onClick={() => playTransition()}>Get Started</Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className={`rounded-lg p-2 md:hidden ${textClasses}`}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={!shouldReduceMotion ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={!shouldReduceMotion ? { opacity: 0 } : undefined}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeMobile}
          >
            <motion.div
              initial={!shouldReduceMotion ? { x: "100%" } : undefined}
              animate={{ x: 0 }}
              exit={!shouldReduceMotion ? { x: "100%" } : undefined}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed right-0 top-0 flex h-full w-72 flex-col bg-white px-6 py-8 dark:bg-[#0D1117]"
            >
              <div className="mb-8 flex justify-end">
                <button onClick={closeMobile} className="rounded-lg p-2 text-fcn-text-light dark:text-fcn-text-dark" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => { handleNavClick(e, link.href); closeMobile(); }}
                    className="rounded-lg px-4 py-3 text-base font-medium text-fcn-text-light transition hover:bg-fcn-primary/10 dark:text-fcn-text-dark"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <Link to="/login" onClick={closeMobile}>
                  <Button variant="secondary" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => { closeMobile(); playTransition(); }}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};