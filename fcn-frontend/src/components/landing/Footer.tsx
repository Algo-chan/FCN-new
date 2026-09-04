import { Facebook, Heart, Instagram, Linkedin, Mail, MapPin, Send, Twitter } from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Platform",
    links: [{ label: "Features", href: "#features" }, { label: "How It Works", href: "#how-it-works" }, { label: "For Hospitals", href: "#for-hospitals" }, { label: "For Doctors", href: "#for-doctors" }, { label: "FAQ", href: "#faq" }]
  },
  {
    title: "Company",
    links: [{ label: "About Us", href: "#" }, { label: "Careers", href: "#" }, { label: "Contact", href: "mailto:hello@fcncare.com" }, { label: "Blog", href: "#" }]
  },
  {
    title: "Legal",
    links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Cookie Policy", href: "#" }]
  }
];

const SOCIALS = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" }
];

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-white/60 dark:bg-[#0D1117]/85 backdrop-blur-sm">
      {/* Brand hairline */}
      <div className="h-px w-full bg-gradient-to-r from-fcn-accent via-fcn-primary to-fcn-accent opacity-70" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        {/* Top band: brand + newsletter */}
        <div className="grid gap-10 border-b border-fcn-primary/10 pb-12 dark:border-white/10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <img
              src="/logo/fcn-logo-full.png"
              alt="Fast Care Now Logo"
              className="h-18 w-auto"
            />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-fcn-text-light/55 dark:text-fcn-text-dark/55">
              Fast Care Now connects patients with quality care — from booking appointments to
              managing health records — all in one place.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 text-fcn-text-light/55 dark:text-fcn-text-dark/55">
                <MapPin className="h-4 w-4 shrink-0 text-fcn-primary dark:text-fcn-accent" />
                Dire Dawa, Ethiopia
              </li>
              <li>
                <a
                  href="mailto:hello@fcncare.com"
                  className="flex items-center gap-2.5 text-fcn-text-light/55 transition hover:text-fcn-primary dark:text-fcn-text-dark/55 dark:hover:text-fcn-accent"
                >
                  <Mail className="h-4 w-4 shrink-0 text-fcn-primary dark:text-fcn-accent" />
                  hello@fcncare.com
                </a>
              </li>
            </ul>

            <div className="mt-7 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-fcn-primary/15 text-fcn-text-light/50 transition hover:border-fcn-accent/60 hover:text-fcn-accent dark:border-white/10 dark:text-fcn-text-dark/50"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-fcn-primary/10 bg-white/70 p-6 shadow-sm dark:bg-fcn-dark/60">
              <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Stay updated</h4>
              <p className="mt-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                Get the latest Fast Care Now news, features, and updates.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="h-10 flex-1 rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/45 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/45"
                  aria-label="Email for newsletter"
                />
                <button className="inline-flex h-10 items-center gap-1.5 rounded-md bg-fcn-primary px-4 text-sm font-medium text-white transition hover:bg-fcn-primary/85 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                  Subscribe
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-block text-sm text-fcn-text-light/55 transition hover:text-fcn-primary dark:text-fcn-text-dark/55 dark:hover:text-fcn-accent"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-fcn-primary/10 pt-7 text-xs text-fcn-text-light/45 dark:border-white/10 dark:text-fcn-text-dark/45 sm:flex-row">
          <p>&copy; {year} Fast Care Now. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition hover:text-fcn-primary dark:hover:text-fcn-accent">Privacy</a>
            <a href="#" className="transition hover:text-fcn-primary dark:hover:text-fcn-accent">Terms</a>
            <a href="#" className="transition hover:text-fcn-primary dark:hover:text-fcn-accent">Cookies</a>
          </div>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-fcn-danger text-fcn-danger" /> in Dire Dawa, Ethiopia
          </p>
        </div>
      </div>
    </footer>
  );
};