import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarCheck,
  FileText,
  HeartHandshake,
  HelpCircle,
  Mail,
  ArrowLeft,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/Button";

export const TermsOfServicePage = () => {
  useEffect(() => {
    document.title = "Terms of Service | Fast Care Now";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-14 space-y-10">
        {/* Breadcrumb */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Header */}
        <header className="space-y-4 border-b border-slate-200 dark:border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-700 dark:text-teal-300 text-xs font-bold">
            <Scale className="h-4 w-4" />
            <span>Fast Care Now • Legal Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms of Service
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Welcome to Fast Care Now. These Terms of Service govern your access to and use of our
            telemedicine and digital healthcare services, doctor directory, AI symptom triage, and pharmacy tools.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500 pt-2">
            <span>Last updated: October 2026</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Effective during Dire Dawa Pilot Phase & Nationwide Expansion
            </span>
          </div>
        </header>

        {/* Critical Emergency Disclaimer Alert */}
        <div className="rounded-3xl border border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/20 p-5 sm:p-6 text-rose-900 dark:text-rose-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2.5 font-black text-rose-700 dark:text-rose-300 text-sm sm:text-base">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>CRITICAL NOTICE: NOT FOR IMMEDIATE MEDICAL EMERGENCIES</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-rose-800/90 dark:text-rose-300/90">
            Fast Care Now is an appointment-based digital healthcare and triage platform. It is{" "}
            <strong>NOT an emergency response system</strong>. If you or someone in your care is experiencing severe
            chest pain, shortness of breath, sudden weakness, severe bleeding, or other life-threatening symptoms,
            proceed immediately to the nearest hospital emergency room (e.g., <strong>Dil Chora Referral Hospital</strong> in Dire Dawa)
            or contact local emergency services immediately.
          </p>
        </div>

        {/* Core Principles Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Admin-Verified Doctors</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every physician must submit valid medical licenses and hospital credentials before activation.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Transparent Pricing</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upfront consultation fees displayed on every doctor card with zero surprise charges.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Licensed Hospital Network</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Affiliated with certified clinics, regional referral hospitals, and community healthcare centers.
            </p>
          </div>
        </div>

        {/* Detailed Terms Sections */}
        <section className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                1
              </span>
              <span>Acceptance & Eligibility</span>
            </h2>
            <p>
              By accessing Fast Care Now (via website, mobile application, or partner terminal), you confirm that you:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>Are at least 18 years of age or possess legal parental/guardian consent if booking care for a minor.</li>
              <li>Provide truthful, current, and accurate medical and contact details.</li>
              <li>Agree to receive consultation updates, reminders, and verification codes via SMS or email.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                2
              </span>
              <span>"Verified by FCN" Doctor Verification Guarantee</span>
            </h2>
            <p>
              Trust and clinical safety are paramount. Before any doctor is awarded the{" "}
              <strong className="text-teal-600 dark:text-teal-400 font-bold">Verified by FCN</strong> badge and permitted to consult with patients:
            </p>
            <div className="rounded-2xl border border-teal-500/25 bg-teal-50/70 dark:bg-teal-950/20 p-4 sm:p-5 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Rigorous Multi-Step Administrative Vetting:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                <li>Government medical practitioner license verification against Ethiopian regulatory registries.</li>
                <li>Proof of hospital affiliation or recognized clinical practice credentials.</li>
                <li>Identity confirmation and specialty qualification checks by FCN clinical administrators.</li>
                <li>Regular peer reviews and patient feedback audits to maintain service standards.</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                3
              </span>
              <span>Telemedicine & Patient Care Relationship</span>
            </h2>
            <p>
              Fast Care Now provides technology infrastructure connecting patients with independent, licensed medical practitioners:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-900 dark:text-white">Independent Medical Judgment:</strong> Consulting physicians exercise their independent professional medical judgment. Fast Care Now does not interfere in diagnostic or therapeutic decisions.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Physical vs Remote Care:</strong> While many ailments can be managed via remote video or audio visits, your doctor may determine that an in-person clinic visit, lab test, or home nurse follow-up is medically required.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">AI Symptom Check:</strong> Our AI triage feature provides preliminary educational guidance and specialty matching only; it does not replace a physical clinical examination.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                4
              </span>
              <span>Transparent Pricing & Fee Structure</span>
            </h2>
            <p>
              Fast Care Now displays transparent consultation rates upfront on doctor cards and profile pages.
              Patients can review fees before confirming an appointment. All rates are shown in Ethiopian Birr (ETB)
              with zero hidden platform markups.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Any future adjustments to fee schedules will be communicated transparently on doctor cards and profiles in advance. No patient will ever be charged without prior explicit authorization.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                5
              </span>
              <span>Digital Prescriptions & Controlled Medications</span>
            </h2>
            <p>
              Doctors may issue electronic prescriptions with cryptographic QR codes verifiable by participating pharmacies. Doctors are under no obligation to prescribe any medication if they believe it is clinically inappropriate. Controlled substances and narcotics cannot be prescribed via remote consultation alone and require formal in-person clinical authorization.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                6
              </span>
              <span>Governing Law & Dispute Resolution</span>
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Federal Democratic
              Republic of Ethiopia. Any dispute arising out of or related to these Terms shall be resolved
              through amicable consultation or submitted to the competent courts of Dire Dawa, Ethiopia.
            </p>
          </div>

          {/* Contact Box */}
          <div className="rounded-3xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900 p-6 sm:p-8 space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Contact Us Regarding Terms</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              For questions regarding our terms, provider onboarding, or patient rights:
            </p>
            <div className="pt-2 text-sm font-semibold space-y-1 text-slate-800 dark:text-slate-200">
              <p>Fast Care Now Legal Operations</p>
              <p className="text-teal-600 dark:text-teal-400">Email: legal@fastcarenow.et / hello@fcncare.com</p>
              <p className="text-xs text-slate-500">Dire Dawa, Ethiopia</p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Read how we safeguard your personal health records in our{" "}
            <Link to="/privacy-policy" className="text-teal-600 dark:text-teal-400 font-semibold underline">
              Privacy Policy
            </Link>
            .
          </p>

          <Link to="/doctors">
            <Button variant="action">Find Verified Doctors</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
