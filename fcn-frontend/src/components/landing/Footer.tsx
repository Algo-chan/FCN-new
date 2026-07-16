import { Facebook, Heart, Instagram, Linkedin, Twitter } from "lucide-react";

const links = [
  { title: "Platform", items: [{ label: "Features", href: "#features" }, { label: "How It Works", href: "#how-it-works" }, { label: "For Hospitals", href: "#for-hospitals" }, { label: "For Doctors", href: "#for-doctors" }, { label: "FAQ", href: "#faq" }] },
  { title: "Company", items: [{ label: "About Us", href: "#" }, { label: "Careers", href: "#" }, { label: "Contact", href: "mailto:hello@fcn.health" }, { label: "Blog", href: "#" }] },
  { title: "Legal", items: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Cookie Policy", href: "#" }] }
];

const socialIcons = [
  { icon: Facebook, href: "#" },
  { icon: Twitter, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Linkedin, href: "#" }
];

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-white/50 dark:bg-[#0D1117]/80">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div>
            <img
              src="/logo/fcn-logo-full.png"
              alt="FCN Logo"
              className="mb-3 h-9 w-auto"
            />
            <div className="mt-4 flex gap-3">
              {socialIcons.map((s) => (
                <a key={s.href} href={s.href} className="rounded-full p-2 text-fcn-text-light/40 transition hover:text-fcn-accent dark:text-gray-400" aria-label="Social link">
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {links.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-fcn-text-light dark:text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-fcn-text-light/50 transition hover:text-fcn-accent dark:text-gray-400"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-fcn-text-light dark:text-white">Stay Updated</h4>
            <p className="mb-3 text-sm text-fcn-text-light/50 dark:text-gray-400">Get the latest FCN news and updates</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="your@email.com"
                className="h-10 flex-1 rounded-lg border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-[#0D1117] dark:text-fcn-text-dark"
                aria-label="Email for newsletter"
              />
              <button className="rounded-lg bg-fcn-primary px-3 text-sm font-medium text-white transition hover:bg-fcn-primary/80">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-fcn-text-light/40 dark:text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; 2025 Foundation Care Network. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-fcn-danger" /> in Dire Dawa, Ethiopia
          </p>
        </div>
      </div>
    </footer>
  );
};