import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Facebook,
  FileCheck,
  Heart,
  HeartPulse,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  QrCode,
  Send,
  ShieldCheck,
  Stethoscope,
  Twitter,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

interface NavLinkItem {
  label: string;
  href: string;
  isRoute?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  icon: typeof Stethoscope;
  links: NavLinkItem[];
}

const CLINICAL_NAV_SECTIONS: NavSection[] = [
  {
    title: "Clinical Services",
    icon: Stethoscope,
    links: [
      { label: "Find Licensed Doctors", href: "/doctors", isRoute: true },
      { label: "AI Clinical Triage", href: "/ai-check", isRoute: true, badge: "AI" },
      { label: "Digital E-Prescriptions", href: "/pharmacy", isRoute: true },
      { label: "In-Home Nurse Visits", href: "/#features" },
      { label: "Chronic Disease Care", href: "/#features" },
      { label: "Lab Diagnostic Routing", href: "/#features" },
    ],
  },
  {
    title: "Medical Specialties",
    icon: HeartPulse,
    links: [
      { label: "General & Family Medicine", href: "/doctors?specialty=General+Medicine", isRoute: true },
      { label: "Pediatrics & Child Health", href: "/doctors?specialty=Pediatrics", isRoute: true },
      { label: "Cardiology & Vascular", href: "/doctors?specialty=Cardiology", isRoute: true },
      { label: "Obstetrics & Maternal Care", href: "/doctors?specialty=Obstetrics", isRoute: true },
      { label: "Dermatology & Skin Care", href: "/doctors?specialty=Dermatology", isRoute: true },
      { label: "Internal Medicine", href: "/doctors?specialty=Internal+Medicine", isRoute: true },
    ],
  },
  {
    title: "Healthcare Network",
    icon: Building2,
    links: [
      { label: "Dil Chora Referral Hospital", href: "/#for-hospitals" },
      { label: "Dire Dawa Health Centers", href: "/#for-hospitals" },
      { label: "Doctor Provider Portal", href: "/login", isRoute: true },
      { label: "Hospital Admin Access", href: "/login", isRoute: true },
      { label: "Partner Pharmacy Network", href: "/pharmacy", isRoute: true },
      { label: "Verify EFDA Prescription QR", href: "/pharmacy/verify", isRoute: true, badge: "EFDA" },
    ],
  },
  {
    title: "Safety & Governance",
    icon: ShieldCheck,
    links: [
      { label: "Ethiopian MoH Standards", href: "/#features" },
      { label: "EFDA Digital Rx Guidelines", href: "/#features" },
      { label: "Verified Doctor Guarantee", href: "/#features" },
      { label: "Patient Rights & Consent", href: "/privacy-policy#patient-rights", isRoute: true },
      { label: "Clinical Privacy Policy", href: "/privacy-policy", isRoute: true },
      { label: "Terms of Telemedicine", href: "/terms-of-service", isRoute: true },
    ],
  },
];

const CLINICAL_TRUST_PILLARS = [
  {
    icon: CheckCircle2,
    title: "Licensed Practitioners",
    description: "100% credential-checked with Ethiopian Medical Association & Regional Health Bureau",
  },
  {
    icon: QrCode,
    title: "EFDA-Compliant QR Rx",
    description: "Cryptographically signed e-prescriptions recognized by licensed pharmacies",
  },
  {
    icon: Lock,
    title: "Encrypted Health Records",
    description: "AES-256 encrypted patient charts adhering to strict clinical privacy standards",
  },
  {
    icon: Building2,
    title: "Dil Chora Referral Link",
    description: "Direct referral coordination with Dire Dawa's primary public referral center",
  },
];

const SOCIALS = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/fastcarenow" },
  { icon: Twitter, label: "X (Twitter)", href: "https://twitter.com/fastcarenow" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/fastcarenow" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/fastcarenow" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const year = new Date().getFullYear();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="relative overflow-hidden bg-white/70 dark:bg-[#0A0F1D]/90 backdrop-blur-md border-t border-fcn-primary/15 dark:border-white/10 text-fcn-text-light dark:text-fcn-text-dark">
      {/* Background medical vector watermarks */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-20 h-96 w-96 opacity-[0.03] dark:opacity-[0.04] select-none"
        style={{
          backgroundImage: "url(/images/medical/stethoscope.svg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-32 h-80 w-80 opacity-[0.025] dark:opacity-[0.035] select-none"
        style={{
          backgroundImage: "url(/images/medical/ecg-monitor.svg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
      />

      {/* ── 1. Top Clinical Emergency & Hotline Bar ────────────────── */}
      <div className="relative border-b border-red-500/20 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-red-500/10 dark:from-red-950/40 dark:via-amber-950/20 dark:to-red-950/40">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Urgent Notice Label */}
            <div className="flex items-start sm:items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0 mt-1 sm:mt-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  Medical Emergency Notice
                </span>
                <p className="text-xs text-fcn-text-light/75 dark:text-fcn-text-dark/75 leading-relaxed">
                  Experiencing chest pain, severe trauma, or breathing distress? Contact Dire Dawa emergency ambulance immediately.
                </p>
              </div>
            </div>

            {/* Direct Emergency Call Actions */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              <a
                href="tel:907"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                title="Call Dire Dawa Emergency Ambulance (907)"
              >
                <PhoneCall className="h-3.5 w-3.5 animate-bounce" />
                <span>Call 907 (Ambulance)</span>
              </a>
              <a
                href="tel:+251251112020"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-white/80 dark:bg-black/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 transition hover:bg-red-50 dark:hover:bg-red-950/50"
                title="Dil Chora Referral Hospital Emergency Room"
              >
                <Building2 className="h-3.5 w-3.5 text-red-500" />
                <span>Dil Chora ER: +251 25 111 2020</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Clinical Trust & Compliance Strip ───────────────────── */}
      <div className="border-b border-fcn-primary/10 dark:border-white/10 bg-fcn-primary/[0.02] dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CLINICAL_TRUST_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="flex items-start gap-3.5 rounded-xl border border-fcn-primary/10 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] p-4 transition hover:border-fcn-accent/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fcn-primary/10 text-fcn-primary dark:bg-fcn-accent/15 dark:text-fcn-accent">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-fcn-text-light dark:text-white uppercase tracking-wider">
                    {pillar.title}
                  </h4>
                  <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Main Footer Content (Brand, Bulletin & Links) ───────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Top Half: Clinical Profile & Public Health Advisory */}
        <div className="grid gap-10 border-b border-fcn-primary/10 pb-12 dark:border-white/10 lg:grid-cols-12 lg:gap-10">
          {/* Brand & Clinical Mission */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <BrandLogo variant="adaptive" className="h-10 w-auto" />
              <span className="rounded-full border border-fcn-accent/30 bg-fcn-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fcn-primary dark:text-fcn-accent">
                Certified Health Network
              </span>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-fcn-text-light/65 dark:text-fcn-text-dark/65">
              Fast Care Now (FCN) is Eastern Ethiopia&apos;s certified digital healthcare platform.
              We connect patients with verified Ethiopian physicians, Dil Chora Referral Hospital,
              and licensed community pharmacies for virtual triage, e-prescriptions, and continuous clinical care.
            </p>

            {/* Clinical Contact Details Grid */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="flex items-start gap-2.5 text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-fcn-primary dark:text-fcn-accent" />
                <span>
                  <strong>Clinical Hub:</strong> Ras Makonnen St, Kebele 02, Dire Dawa, Ethiopia
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-fcn-primary dark:text-fcn-accent" />
                <span>
                  <strong>In-Person Hours:</strong> Mon–Sat, 8:00 AM – 8:00 PM EAT <br />
                  <span className="text-fcn-accent font-medium">Virtual Triage: 24/7/365</span>
                </span>
              </div>
              <div>
                <a
                  href="tel:+251251110000"
                  className="flex items-center gap-2.5 text-fcn-text-light/70 transition hover:text-fcn-primary dark:text-fcn-text-dark/70 dark:hover:text-fcn-accent"
                >
                  <Phone className="h-4 w-4 shrink-0 text-fcn-primary dark:text-fcn-accent" />
                  <span>
                    <strong>Patient Care Desk:</strong> +251 25 111 0000
                  </span>
                </a>
              </div>
              <div>
                <a
                  href="mailto:clinical@fcncare.com"
                  className="flex items-center gap-2.5 text-fcn-text-light/70 transition hover:text-fcn-primary dark:text-fcn-text-dark/70 dark:hover:text-fcn-accent"
                >
                  <Mail className="h-4 w-4 shrink-0 text-fcn-primary dark:text-fcn-accent" />
                  <span>
                    <strong>Clinical Inquiries:</strong> clinical@fcncare.com
                  </span>
                </a>
              </div>
            </div>

            {/* Social Channels with Clinical Touch */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs font-semibold text-fcn-text-light/50 dark:text-fcn-text-dark/50 uppercase tracking-wider">
                Follow Updates:
              </span>
              <div className="flex gap-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-fcn-primary/15 text-fcn-text-light/60 transition hover:border-fcn-accent hover:bg-fcn-accent/10 hover:text-fcn-accent dark:border-white/10 dark:text-fcn-text-dark/60"
                  >
                    <s.icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Public Health Bulletin & Medical Advisory Newsletter */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-fcn-primary/15 bg-gradient-to-br from-white/90 to-fcn-primary/5 p-6 shadow-sm dark:border-white/10 dark:from-[#0D1527] dark:to-[#0A101D]">
              <div className="flex items-center gap-2 text-fcn-primary dark:text-fcn-accent">
                <Activity className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Public Health Bulletin
                </h4>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-fcn-text-light/65 dark:text-fcn-text-dark/65">
                Subscribe for verified seasonal health alerts (malaria prevention, dengue surveillance, maternal immunization updates) prepared by Ethiopian medical practitioners.
              </p>

              {subscribed ? (
                <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>You are subscribed to Fast Care Now Clinical Bulletins.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patient@fcncare.com"
                      required
                      className="h-10 flex-1 rounded-lg border border-fcn-primary/20 bg-white px-3 text-xs text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/40 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/20 dark:bg-black/40 dark:border-white/15 dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/40"
                      aria-label="Email for clinical bulletins"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-fcn-primary px-4 text-xs font-semibold text-white transition hover:bg-fcn-primary/90 hover:shadow-[0_0_20px_rgba(10,126,164,0.3)] active:scale-95 shrink-0"
                    >
                      <span>Subscribe</span>
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-fcn-text-light/45 dark:text-fcn-text-dark/45 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-fcn-accent shrink-0" />
                    Clinical privacy assured. No marketing spam. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Structured Clinical Navigation Columns ──────────────── */}
        <div className="grid gap-8 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {CLINICAL_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3.5">
              <div className="flex items-center gap-2 text-fcn-text-light/90 dark:text-white">
                <section.icon className="h-4 w-4 text-fcn-primary dark:text-fcn-accent" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {section.title}
                </h4>
              </div>

              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="group inline-flex items-center gap-1.5 text-xs text-fcn-text-light/65 transition hover:text-fcn-primary dark:text-fcn-text-dark/65 dark:hover:text-fcn-accent"
                      >
                        <span className="transition-transform group-hover:translate-x-0.5">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded bg-fcn-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-fcn-primary dark:text-fcn-accent">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-xs text-fcn-text-light/65 transition hover:text-fcn-primary dark:text-fcn-text-dark/65 dark:hover:text-fcn-accent"
                      >
                        <span className="transition-transform group-hover:translate-x-0.5">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded bg-fcn-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-fcn-primary dark:text-fcn-accent">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── 5. Animated ECG Heartbeat Pulse Divider ────────────────── */}
        <div className="my-10 relative flex items-center justify-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-fcn-primary/20 dark:via-white/10 to-transparent" />
          <div className="absolute flex items-center gap-2 bg-white px-3 dark:bg-[#0A0F1D] text-fcn-primary dark:text-fcn-accent">
            <svg
              className="h-5 w-28 text-fcn-primary dark:text-fcn-accent"
              viewBox="0 0 120 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M0 12h25l4-7 6 15 6-18 6 18 5-11 5 3h63" />
            </svg>
            <span className="text-[10px] font-mono font-bold tracking-widest text-fcn-text-light/40 dark:text-fcn-text-dark/40 uppercase">
              ETH HEALTH GRID ACTIVE
            </span>
          </div>
        </div>

        {/* ── 6. Mandatory Clinical Disclaimer ──────────────────────── */}
        <div className="rounded-xl border border-fcn-primary/10 bg-fcn-primary/[0.03] dark:border-white/5 dark:bg-white/[0.015] p-4 text-xs leading-relaxed text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          <p>
            <strong className="text-fcn-text-light/80 dark:text-white/80">Clinical & Legal Disclaimer: </strong>
            Fast Care Now (FCN) is a digital healthcare platform providing appointment scheduling, telemedicine consultations,
            and digital prescription management in partnership with certified medical providers. The AI clinical triage assistant
            is designed for clinical decision support and health guidance, and is not a substitute for professional in-person medical
            diagnosis or emergency care. In case of acute trauma or life-threatening symptoms, immediately dial{" "}
            <a href="tel:907" className="font-bold text-red-600 dark:text-red-400 underline underline-offset-2">
              907
            </a>{" "}
            or visit the nearest emergency room.
          </p>
        </div>

        {/* ── 7. Bottom Legal Bar & Accreditation ────────────────────── */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-fcn-primary/10 pt-6 text-xs text-fcn-text-light/50 dark:border-white/10 dark:text-fcn-text-dark/50 md:flex-row">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>&copy; {year} Fast Care Now Health Technologies PLC. All rights reserved.</p>
            <span className="hidden sm:inline text-fcn-text-light/30 dark:text-fcn-text-dark/30">&bull;</span>
            <span className="inline-flex items-center gap-1.5 text-fcn-primary dark:text-fcn-accent font-medium">
              <FileCheck className="h-3.5 w-3.5" />
              Dire Dawa Health Bureau &amp; EFDA Registered
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              to="/privacy-policy"
              className="transition hover:text-fcn-primary dark:hover:text-fcn-accent"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="transition hover:text-fcn-primary dark:hover:text-fcn-accent"
            >
              Terms of Telemedicine
            </Link>
            <Link
              to="/privacy-policy#patient-rights"
              className="transition hover:text-fcn-primary dark:hover:text-fcn-accent"
            >
              Patient Rights
            </Link>
            <Link
              to="/pharmacy/verify"
              className="inline-flex items-center gap-1 transition hover:text-fcn-primary dark:hover:text-fcn-accent"
            >
              <span>EFDA Rx Verify</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <span>Built with care in Dire Dawa, Ethiopia</span>
            <span className="inline-block" aria-label="Ethiopia">🇪🇹</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
