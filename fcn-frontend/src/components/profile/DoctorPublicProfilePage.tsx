import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarPlus,
  Share2,
  Star,
  Building2,
  Phone,
  Mail,
  Clock,
  BadgeCheck,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Languages
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { doctorsService } from "@/services/doctors.service";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageLayout } from "@/components/layout/PageLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { clsx } from "clsx";

export const DoctorPublicProfilePage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { addToast } = useNotifications();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, isLoading, error } = useQuery({
    queryKey: ["doctor-detail", doctorId],
    queryFn: () => doctorsService.getDoctorById(doctorId!),
    enabled: !!doctorId,
  });

  const profile = data?.data;

  // SEO document title and meta updates
  useEffect(() => {
    if (profile) {
      const city = profile.city || profile.hospital_location || "Dire Dawa";
      document.title = `Dr. ${profile.full_name} - ${profile.specialty} in ${city} | Fast Care Now`;
    }
    return () => {
      document.title = "Fast Care Now - Healthcare in Ethiopia";
    };
  }, [profile]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    addToast({ type: "success", title: "Profile link copied to clipboard!" });
  };

  const handleBook = () => {
    if (!profile) return;
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/appointments/book?doctor_id=${profile.id}` },
      });
      return;
    }
    navigate(`/appointments/book?doctor_id=${profile.id}`);
  };

  const typeLabels: Record<string, string> = {
    remote: "Remote Video/Audio",
    in_person: "In-Person Clinic",
    nurse_visit: "Nurse Home Visit",
  };

  if (isLoading) {
    if (isAuthenticated) {
      return (
        <PageLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
          </div>
        </PageLayout>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    const errorBody = (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-6">
        <p className="text-rose-500 font-bold text-lg">Doctor profile not found</p>
        <p className="text-slate-500 text-sm max-w-md">
          The doctor you are looking for may have moved or is not publicly available.
        </p>
        <Button variant="secondary" onClick={() => navigate("/doctors")}>
          Browse All Available Doctors
        </Button>
      </div>
    );
    if (isAuthenticated) {
      return <PageLayout>{errorBody}</PageLayout>;
    }
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">{errorBody}</div>
        <Footer />
      </div>
    );
  }

  const firstName = profile.full_name.split(" ")[0] ?? "";
  const isAvailable = profile.availability_status === "available";
  const isInSession = profile.availability_status === "in_session";

  const jsonLdScript = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Physician",
          name: `Dr. ${profile.full_name}`,
          medicalSpecialty: profile.specialty,
          description:
            profile.bio ||
            `Dr. ${profile.full_name} is a ${profile.specialty} specialist serving patients in ${profile.city || "Dire Dawa"}, Ethiopia.`,
          address: {
            "@type": "PostalAddress",
            addressLocality: profile.city || "Dire Dawa",
            addressCountry: "ET",
          },
          ...(profile.hospital_name ? { hospitalAffiliation: profile.hospital_name } : {}),
          ...(profile.rating_average && profile.rating_count
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: profile.rating_average,
                  reviewCount: profile.rating_count,
                },
              }
            : {}),
        }),
      }}
    />
  );

  const profileContent = (
    <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Doctors</span>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Profile</span>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-sky-950 p-6 sm:p-10 text-white shadow-xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="relative">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
                />
              ) : (
                <InitialsAvatar name={profile.full_name} size="xl" role="doctor" />
              )}
              {profile.verified && (
                <div
                  className="absolute bottom-1 right-1 flex items-center justify-center w-7 h-7 rounded-full bg-teal-500 text-white shadow-sm ring-2 ring-slate-900"
                  title="Verified by FCN - Medical license checked by admin"
                >
                  <BadgeCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Dr. {profile.full_name}
                </h1>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 backdrop-blur-sm">
                  {profile.specialty}
                </span>

                {profile.verified && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm text-xs font-bold"
                    title="Medical license checked and verified by FCN admin"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified by FCN • License Checked</span>
                  </span>
                )}

                {profile.city && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white/90">
                    <MapPin className="h-3 w-3 text-teal-400" />
                    <span>{profile.city}</span>
                  </span>
                )}

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium">
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      isAvailable && "bg-emerald-400 animate-pulse",
                      isInSession && "bg-amber-400",
                      !isAvailable && !isInSession && "bg-slate-400"
                    )}
                  />
                  <span className="text-white/90">
                    {isAvailable ? "Available Now" : isInSession ? "In Session" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {profile.languages_spoken && profile.languages_spoken.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/80">
                <Languages className="h-3.5 w-3.5 text-teal-300" />
                <span>Languages:</span>
                {profile.languages_spoken.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 border border-white/10"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}

            {profile.consultation_types && profile.consultation_types.length > 0 && (
              <p className="text-xs sm:text-sm text-slate-300">
                Consultation modes:{" "}
                <strong className="text-white">
                  {profile.consultation_types.map((t) => typeLabels[t] ?? t).join(" • ")}
                </strong>
              </p>
            )}
          </div>
        </div>

        {/* Transparent Pricing Card */}
        <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white dark:to-slate-900 p-5 sm:p-6 dark:border-teal-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Transparent Upfront Pricing
            </span>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Consultation Fee:
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {profile.consultation_fee_etb ? `${profile.consultation_fee_etb} Br` : "350 Br"}
              </span>
              {profile.follow_up_fee_etb && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  (Follow-up: {profile.follow_up_fee_etb} Br)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <span>Upfront rate. Browse freely without login; sign in only when you confirm your booking.</span>
            </p>
          </div>

          <Button
            variant="action"
            onClick={handleBook}
            className="min-h-[48px] px-6 text-sm font-bold shadow-[0_8px_20px_rgba(13,148,136,0.3)] flex-shrink-0"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            <span>Book Consultation</span>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profile.rating_average != null && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-900 shadow-sm">
              <Star className="mx-auto h-5 w-5 text-amber-500 fill-amber-500" />
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {Number(profile.rating_average).toFixed(1)}
              </p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {profile.rating_count ?? 0} reviews
              </p>
            </div>
          )}

          {profile.years_experience != null && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-900 shadow-sm">
              <Clock className="mx-auto h-5 w-5 text-teal-600 dark:text-teal-400" />
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {profile.years_experience}
              </p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Years Experience</p>
            </div>
          )}

          {"total_consultations" in profile && profile.total_consultations != null && (
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-900 shadow-sm">
              <ShieldCheck className="mx-auto h-5 w-5 text-sky-600 dark:text-sky-400" />
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {profile.total_consultations}
              </p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Consultations Completed</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
              About Dr. {firstName}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Hospital Affiliation */}
        {profile.hospital_name && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Hospital Affiliation
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-base">
                  {profile.hospital_name}
                </p>
                {profile.hospital_location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {profile.hospital_location}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Patient Reviews */}
        {profile.recent_ratings && profile.recent_ratings.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
              Patient Reviews
            </h3>
            <div className="space-y-3">
              {profile.recent_ratings.map((rating, i) => (
                <div
                  key={rating.id ?? i}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={clsx(
                          "h-3.5 w-3.5",
                          s < (rating.rating ?? 0)
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300 dark:text-slate-700"
                        )}
                      />
                    ))}
                  </div>
                  {rating.review_text && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">
                      &ldquo;{rating.review_text}&rdquo;
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      {"patient_name" in rating && rating.patient_name
                        ? rating.patient_name
                        : "Verified Patient"}
                    </span>
                    <span>•</span>
                    <span>
                      {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );

  const floatingMobileCta = (
    <div
      className={clsx(
        "fixed left-0 right-0 z-30 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 dark:bg-slate-900/95 sm:hidden",
        isAuthenticated
          ? "bottom-16 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          : "bottom-0 pb-[max(16px,env(safe-area-inset-bottom))]"
      )}
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <Button
          variant="action"
          onClick={handleBook}
          className="flex-1 min-h-[50px] text-sm font-bold shadow-[0_8px_24px_rgba(13,148,136,0.35)]"
        >
          <CalendarPlus className="h-5 w-5 mr-2" />
          <span>Book Consultation</span>
        </Button>

        <Button
          variant="secondary"
          onClick={handleShare}
          className="h-[50px] w-[50px] p-0 flex items-center justify-center rounded-2xl flex-shrink-0"
          aria-label="Share doctor profile"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return (
      <PageLayout>
        {jsonLdScript}
        {profileContent}
        {floatingMobileCta}
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      {jsonLdScript}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-20 sm:pt-24 pb-28 sm:pb-12 space-y-6">
        {profileContent}
      </main>
      {floatingMobileCta}
      <Footer />
    </div>
  );
};
