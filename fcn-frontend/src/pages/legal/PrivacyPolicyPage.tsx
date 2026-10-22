import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  EyeOff,
  Database,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/Button";

export const PrivacyPolicyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | Fast Care Now";
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
            <ShieldCheck className="h-4 w-4" />
            <span>Fast Care Now • Legal & Medical Privacy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Fast Care Now is dedicated to protecting your sensitive medical records and personal
            information. We treat your health data with the strictest confidentiality required by
            Ethiopian healthcare ethics and international clinical privacy standards.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500 pt-2">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-500" />
              <span>Last updated: October 2026</span>
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Applies to Dire Dawa & Nationwide Services
            </span>
          </div>
        </header>

        {/* Trust Highlights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Encrypted Health Records</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clinical encounters, prescriptions, and lab logs are stored with role-based cryptographic access controls.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <EyeOff className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Zero Data Selling</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We never sell or rent your personal, behavioral, or medical data to advertisers or third-party brokers.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Doctor-Patient Privilege</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Only your consulting doctor and authorized care staff can view your consultation records.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <section className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                1
              </span>
              <span>Information We Collect</span>
            </h2>
            <p>
              When you use the Fast Care Now healthcare platform, we collect information necessary to
              provide clinical care, facilitate consultations, and ensure patient safety:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-900 dark:text-white">Account Identification:</strong>{" "}
                Full name, mobile phone number, email address, date of birth, emergency contact, and location (e.g. Dire Dawa).
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Clinical & Health Records:</strong>{" "}
                Medical symptoms entered in AI triage, consultation notes created by doctors, prescribed medications, allergies, and vital signs recorded during in-person nurse visits.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Provider Credentials:</strong>{" "}
                For doctors and healthcare workers: professional license numbers, medical council verification credentials, hospital affiliations, and photo identification checked by FCN clinical administrators.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Technical Diagnostics:</strong>{" "}
                Browser type, device operating system, session timestamps, and network telemetry strictly to maintain system reliability and prevent fraudulent access.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                2
              </span>
              <span>How We Use Your Medical Information</span>
            </h2>
            <p>We use your information exclusively for healthcare delivery and platform operations:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Doctor Consultations
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Connecting you with licensed Ethiopian physicians for remote video/audio visits and clinic appointments.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Electronic Prescriptions
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Generating tamper-proof, QR-verified digital prescriptions redeemable at registered pharmacies.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Community Nurse Visits
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dispatching licensed nurses to patient homes for vitals tracking, dressing, and routine follow-up care.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  AI Symptom Guidance
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Analyzing user-submitted symptoms to recommend suitable medical specialties and triage urgency levels.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                3
              </span>
              <span>Doctor-Patient Privilege & Access Controls</span>
            </h2>
            <p>
              Under Ethiopian medical ethics and clinical privacy standards, all communications between
              a patient and a healthcare practitioner are strictly privileged.
            </p>
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/25 space-y-2 text-xs sm:text-sm text-teal-950 dark:text-teal-100">
              <p className="font-bold flex items-center gap-1.5 text-teal-800 dark:text-teal-200">
                <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Strict Need-to-Know Clinical Access</span>
              </p>
              <p>
                Fast Care Now customer support staff and administrative personnel cannot view private
                consultation dialogue, diagnoses, or sensitive health records. Only the treating doctor
                and assigned medical team possess clearance to review your medical encounter history.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                4
              </span>
              <span>Data Retention & Your Patient Rights</span>
            </h2>
            <p>
              You maintain ownership and agency over your healthcare profile. Under Fast Care Now privacy guidelines, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>Access and review your complete digital health records and appointment history at any time.</li>
              <li>Request an electronic copy of your consultations, prescriptions, and lab referrals.</li>
              <li>Request profile deactivation and data deletion, subject only to mandatory legal healthcare retention statutes.</li>
              <li>Opt out of non-clinical notifications or marketing communications.</li>
            </ul>
          </div>

          {/* Section 5 - Cookie & Web Policy */}
          <div id="cookies" className="space-y-3 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-black">
                5
              </span>
              <span>Cookie & Session Storage Policy</span>
            </h2>
            <p>
              Fast Care Now uses essential local storage and secure HTTP cookies strictly to keep you authenticated,
              remember your preferred language (English or Amharic), and maintain your active appointment state. We do not use third-party tracking cookies or sell your browsing footprint.
            </p>
          </div>

          {/* Section 6 - Contact */}
          <div className="rounded-3xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900 p-6 sm:p-8 space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Questions or Privacy Inquiries?</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              If you have any questions regarding your health data privacy or would like to submit a data request, please reach out directly to our compliance officer:
            </p>
            <div className="pt-2 text-sm font-semibold space-y-1 text-slate-800 dark:text-slate-200">
              <p>Fast Care Now Clinical Operations</p>
              <p className="text-teal-600 dark:text-teal-400">Email: privacy@fastcarenow.et / hello@fcncare.com</p>
              <p className="text-xs text-slate-500">Dire Dawa, Ethiopia</p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need to review our platform terms? Read our{" "}
            <Link to="/terms-of-service" className="text-teal-600 dark:text-teal-400 font-semibold underline">
              Terms of Service
            </Link>
            .
          </p>

          <Link to="/doctors">
            <Button variant="action">Browse Verified Doctors</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
