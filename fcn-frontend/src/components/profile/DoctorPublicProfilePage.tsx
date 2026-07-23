import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { CalendarPlus, Share2, Star, Building2, Phone, Mail, Clock, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileService, type DoctorPublicProfile } from "@/services/profile.service";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useNotifications } from "@/hooks/useNotifications";

export const DoctorPublicProfilePage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { addToast } = useNotifications();

  const { data, isLoading, error } = useQuery({
    queryKey: ["doctor-public-profile", doctorId],
    queryFn: () => profileService.getDoctorPublicProfile(doctorId!),
    enabled: !!doctorId
  });

  const profile = data?.data;

  const handleShare = () => {
    const url = `${window.location.origin}/doctors/${doctorId}`;
    navigator.clipboard.writeText(url);
    addToast({ type: "success", title: "Profile link copied!" });
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-fcn-danger">Doctor not found</p>
        <Button variant="ghost" onClick={() => navigate("/doctors")}>Find Doctors</Button>
      </div>
    );
  }

  const firstName = profile.full_name.split(" ")[0] ?? "";

  const statusColors: Record<string, string> = {
    available: "bg-fcn-success",
    in_session: "bg-fcn-warning",
    unavailable: "bg-gray-400"
  };

  const typeLabels: Record<string, string> = {
    remote: "Remote",
    in_person: "In-Person",
    nurse_visit: "Nurse Visit"
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0D1B3E] to-fcn-primary p-8 text-white">
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.full_name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20" />
          ) : (
            <InitialsAvatar name={profile.full_name} size="xl" role="doctor" />
          )}
          <div>
            <h1 className="text-2xl font-bold">Dr. {profile.full_name}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="info">{profile.specialty}</Badge>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusColors[profile.availability_status] ?? "bg-gray-400"} ${profile.availability_status === "available" ? "animate-pulse" : ""}`} />
                <span className="text-sm text-white/80">
                  {profile.availability_status === "available" ? "Available" : profile.availability_status === "in_session" ? "In Session" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>

          {profile.languages_spoken && profile.languages_spoken.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.languages_spoken.map((lang) => (
                <span key={lang} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/90">{lang}</span>
              ))}
            </div>
          )}

          {profile.consultation_types && profile.consultation_types.length > 0 && (
            <p className="text-sm text-white/70">
              Available for: {profile.consultation_types.map((t) => typeLabels[t] ?? t).join(" / ")}
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {"rating_average" in profile && profile.rating_average != null && (
          <Card className="text-center p-3">
            <Star className="mx-auto h-5 w-5 text-fcn-warning fill-fcn-warning" />
            <p className="mt-1 text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">{Number(profile.rating_average).toFixed(1)}</p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{profile.rating_count} reviews</p>
          </Card>
        )}
        {"years_experience" in profile && profile.years_experience != null && (
          <Card className="text-center p-3">
            <Clock className="mx-auto h-5 w-5 text-fcn-primary" />
            <p className="mt-1 text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">{profile.years_experience}</p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Years Experience</p>
          </Card>
        )}
        {"consultation_count" in profile && profile.consultation_count != null && (
          <Card className="text-center p-3">
            <CalendarPlus className="mx-auto h-5 w-5 text-fcn-accent" />
            <p className="mt-1 text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">{profile.consultation_count}</p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Consultations</p>
          </Card>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-2">About Dr. {firstName}</h3>
          <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70 leading-relaxed">{profile.bio}</p>
        </Card>
      )}

      {/* Hospital */}
      {"hospital_name" in profile && profile.hospital_name && (
        <Card>
          <h3 className="text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60 mb-2">Affiliated with:</h3>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-fcn-primary" />
            <div>
              <p className="font-medium text-fcn-text-light dark:text-fcn-text-dark">{profile.hospital_name}</p>
              {"hospital_location" in profile && typeof profile.hospital_location === "string" && (
                <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{profile.hospital_location}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Contact */}
      {"phone" in profile || "email" in profile ? (
        <Card>
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-3">Contact Dr. {firstName}</h3>
          <div className="space-y-2">
            {"phone" in profile && profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-fcn-primary" />
                <span className="text-fcn-text-light dark:text-fcn-text-dark">{profile.phone}</span>
              </div>
            )}
            {"email" in profile && profile.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-fcn-primary" />
                <span className="text-fcn-text-light dark:text-fcn-text-dark">{profile.email}</span>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* Ratings */}
      {"recent_ratings" in profile && profile.recent_ratings && profile.recent_ratings.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-3">Patient Reviews</h3>
          <div className="space-y-3">
            {profile.recent_ratings.map((rating, i) => (
              <motion.div
                key={rating.id ?? i}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-fcn-primary/5 p-3"
              >
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s < (rating.rating ?? 0) ? "text-fcn-warning fill-fcn-warning" : "text-gray-300"}`} />
                  ))}
                </div>
                {(rating as any).review_text && <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">{(rating as any).review_text}</p>}
                <div className="mt-1 flex items-center gap-2 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                  <span>Patient</span>
                  <span>·</span>
                  <span>{new Date(rating.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* CTA */}
      <div className="sticky bottom-0 z-10 rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur dark:bg-fcn-dark/90">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate(`/appointments/book?doctor_id=${profile.id}`)} className="flex-1">
            <CalendarPlus className="h-4 w-4" />
            Book a Consultation with Dr. {firstName}
          </Button>
          <Button variant="ghost" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
