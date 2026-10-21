import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus, Share2, Star, Building2, Phone, Mail, Clock, ChevronRight, BadgeCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileService, type DoctorPublicProfile } from "@/services/profile.service";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useNotifications } from "@/hooks/useNotifications";
import { clsx } from "clsx";

export const DoctorPublicProfilePage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { addToast } = useNotifications();

  const { data, isLoading, error } = useQuery({
    queryKey: ["doctor-public-profile", doctorId],
    queryFn: () => profileService.getDoctorPublicProfile(doctorId!),
    enabled: !!doctorId,
  });

  const profile = data?.data;

  const handleShare = () => {
    const url = `${window.location.origin}/doctors/${doctorId}`;
    navigator.clipboard.writeText(url);
    addToast({ type: "success", title: "Profile link copied to clipboard!" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center p-6">
        <p className="text-rose-500 font-bold">Doctor profile not found</p>
        <Button variant="secondary" onClick={() => navigate("/doctors")}>
          Browse All Doctors
        </Button>
      </div>
    );
  }

  const firstName = profile.full_name.split(" ")[0] ?? "";
  const isAvailable = profile.availability_status === "available";
  const isInSession = profile.availability_status === "in_session";

  const typeLabels: Record<string, string> = {
    remote: "Remote Video/Audio",
    in_person: "In-Person Clinic",
    nurse_visit: "Nurse Home Visit",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
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
            <div className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white shadow-sm ring-2 ring-slate-900">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Dr. {profile.full_name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 backdrop-blur-sm">
                {profile.specialty}
              </span>
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
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.languages_spoken.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-semibold text-white/90 border border-white/10"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}

          {profile.consultation_types && profile.consultation_types.length > 0 && (
            <p className="text-xs sm:text-sm text-slate-300">
              Available for:{" "}
              <strong className="text-white">
                {profile.consultation_types.map((t) => typeLabels[t] ?? t).join(" • ")}
              </strong>
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {"rating_average" in profile && profile.rating_average != null && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <Star className="mx-auto h-5 w-5 text-amber-500 fill-amber-500" />
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {Number(profile.rating_average).toFixed(1)}
            </p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {profile.rating_count} reviews
            </p>
          </div>
        )}
        {"years_experience" in profile && profile.years_experience != null && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <Clock className="mx-auto h-5 w-5 text-teal-600 dark:text-teal-400" />
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {profile.years_experience}
            </p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Years Experience</p>
          </div>
        )}
        {"consultation_count" in profile && profile.consultation_count != null && (
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-900 shadow-sm">
            <CalendarPlus className="mx-auto h-5 w-5 text-sky-600 dark:text-sky-400" />
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {profile.consultation_count}
            </p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Consultations</p>
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
      {"hospital_name" in profile && profile.hospital_name && (
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
              {"hospital_location" in profile && typeof profile.hospital_location === "string" && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile.hospital_location}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact info */}
      {"phone" in profile || "email" in profile ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-slate-900 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3">
            Contact Dr. {firstName}
          </h3>
          <div className="space-y-2 text-sm">
            {"phone" in profile && profile.phone && (
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                <Phone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>{profile.phone}</span>
              </div>
            )}
            {"email" in profile && profile.email && (
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Recent Reviews */}
      {"recent_ratings" in profile && profile.recent_ratings && profile.recent_ratings.length > 0 && (
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
                {(rating as any).review_text && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {(rating as any).review_text}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span>Verified Patient</span>
                  <span>•</span>
                  <span>{new Date(rating.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Action CTA on Mobile, clean bar on Desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-[max(16px,env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 dark:bg-slate-900/90 sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button
            variant="action"
            onClick={() => navigate(`/appointments/book?doctor_id=${profile.id}`)}
            className="flex-1 min-h-[52px] text-sm font-bold shadow-[0_8px_24px_rgba(13,148,136,0.35)]"
          >
            <CalendarPlus className="h-5 w-5 mr-2" />
            <span>Book Consultation with Dr. {firstName}</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleShare}
            className="h-[52px] w-[52px] p-0 flex items-center justify-center rounded-2xl flex-shrink-0"
            aria-label="Share doctor profile"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
