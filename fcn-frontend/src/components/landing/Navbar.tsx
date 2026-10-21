import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { clsx } from "clsx";
import { MOTION } from "@/styles/motion";

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
    ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200/60 dark:border-white/10"
    : "bg-transparent";

  const textClasses = scrolled
    ? "text-slate-700 dark:text-slate-200"
    : "text-white";

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClasses}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo/fcn-logo-full.png"
            alt="Fast Care Now Logo"
            className="hidden sm:block h-8 w-auto sm:h-9 object-contain"
          />
          <span className="sm:hidden flex items-center gap-1 text-lg font-black tracking-tight leading-none">
            <span className="text-slate-900 dark:text-white">Fast</span>
            <span className="bg-gradient-to-r from-teal-500 via-teal-400 to-sky-500 bg-clip-text text-transparent">
              Care
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`text-sm font-semibold transition hover:text-teal-500 ${textClasses}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher
            variant="compact"
            btnClassName={clsx(
              "border transition-colors duration-200",
              scrolled
                ? "bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-200 border-slate-200/80 dark:border-white/10"
                : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            )}
          />

          <button
            onClick={toggleTheme}
            className={`rounded-xl p-2 transition hover:bg-white/10 ${textClasses}`}
            aria-label="Toggle theme"
          >
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={!shouldReduceMotion ? { rotate: -90, opacity: 0 } : undefined}
              animate={{ rotate: 0, opacity: 1 }}
              transition={shouldReduceMotion ? { duration: 0 } : MOTION.spring}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <InstallAppButton size="sm" />
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" variant="action" onClick={() => playTransition()}>Get Started</Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className={`rounded-xl p-2 md:hidden ${textClasses}`}
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
              className="fixed right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white px-6 py-8 dark:bg-slate-900 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <img
                  src="/logo/fcn-logo-full.png"
                  alt="Fast Care Now Logo"
                  className="h-7 w-auto object-contain"
                />
                <button
                  onClick={closeMobile}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-300"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Language</p>
                <LanguageSwitcher variant="full" />
              </div>

              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => { handleNavClick(e, link.href); closeMobile(); }}
                    className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-white/10">
                <InstallAppButton size="sm" fullWidth />
                <Link to="/login" onClick={closeMobile}>
                  <Button variant="secondary" className="w-full min-h-[48px]">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => { closeMobile(); playTransition(); }}>
                  <Button variant="action" className="w-full min-h-[48px]">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
