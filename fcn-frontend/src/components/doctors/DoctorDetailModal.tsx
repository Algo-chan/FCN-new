import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  Building2, CalendarPlus, Clock, Languages, MessageCircle, Star, Users,
  Award, DollarSign, BadgeCheck, MapPin, Repeat
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PilotBadge } from "@/components/ui/PilotBadge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/store/auth.store";
import type { PublicDoctorDetail } from "@/types";

interface DoctorDetailModalProps {
  doctor: PublicDoctorDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "available": return "success";
    case "in_session": return "warning";
    default: return "neutral";
  }
};

const RatingStars = ({ rating }: { rating: number }) => {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!starsRef.current) return;
    const spans = starsRef.current.querySelectorAll("span");
    gsap.fromTo(
      spans,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        stagger: 0.08,
        duration: 0.35,
        ease: "back.out(2)"
      }
    );
  }, [rating]);

  return (
    <div ref={starsRef} className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>
          <Star
            className={`h-4 w-4 ${i < Math.round(rating) ? "fill-fcn-warning text-fcn-warning" : "text-fcn-primary/20"}`}
          />
        </span>
      ))}
      <span className="ml-1.5 text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const AnonymizedRating = ({ rating, fallbackName }: { rating: { rating: number; review_text?: string | null; created_at: string }; fallbackName?: string }) => {
  const { t } = useTranslation();
  return (
    <div className="border-b border-fcn-primary/5 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < rating.rating ? "fill-fcn-warning text-fcn-warning" : "text-fcn-primary/10"}`}
            />
          ))}
        </div>
        <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : ""}
        </span>
        {fallbackName && (
          <span className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">— {fallbackName}</span>
        )}
        <span className="sr-only">{t("common.reviews")}</span>
      </div>
      {rating.review_text && (
        <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70 italic">
          &ldquo;{rating.review_text}&rdquo;
        </p>
      )}
    </div>
  );
};

export const DoctorDetailModal = ({ doctor, isOpen, onClose }: DoctorDetailModalProps) => {
  const navigate = useNavigate();
  const photoRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen || !photoRef.current) return;
    gsap.fromTo(
      photoRef.current,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  }, [isOpen]);

  const firstName = useMemo(
    () => (doctor ? doctor.full_name.split(" ")[0] : ""),
    [doctor]
  );

  if (!doctor) return null;

  const statusLabel =
    doctor.availability_status === "available"
      ? t("common.available")
      : doctor.availability_status === "in_session"
        ? t("common.inSession")
        : t("common.unavailable");

  const consultFee = doctor.consultation_fee_etb ? t("filter.etb") + " " + doctor.consultation_fee_etb : "—";
  const followUpFee = doctor.follow_up_fee_etb ? t("filter.etb") + " " + doctor.follow_up_fee_etb : "—";

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/appointments/book?doctor_id=${doctor.id}` } });
      return;
    }
    navigate(`/appointments/book?doctor_id=${doctor.id}`);
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/appointments/book?doctor_id=${doctor.id}` } });
      return;
    }
    navigate(`/appointments/book?doctor_id=${doctor.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div ref={photoRef} className="flex-shrink-0">
            <div className="h-[120px] w-[120px] rounded-2xl overflow-hidden">
              {doctor.photo_url ? (
                <img
                  src={doctor.photo_url}
                  alt={doctor.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlaceholder
                  query={`Ethiopian doctor professional portrait, medical setting, ${doctor.specialty}`}
                  alt={doctor.full_name}
                  aspectRatio="1/1"
                  rounded="2xl"
                  className="h-full w-full"
                />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                Dr. {doctor.full_name}
              </h2>
              {doctor.verified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-fcn-success/10 px-2.5 py-0.5 text-xs font-medium text-fcn-success"
                  title={t("common.verified")}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t("common.verified").replace("✓ ", "")}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">{doctor.specialty}</Badge>
              <Badge variant={statusBadgeVariant(doctor.availability_status)} size="sm">
                {statusLabel}
              </Badge>
              <PilotBadge size="xs" variant="glow" />
            </div>
            {(doctor.hospital_name || doctor.city) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                {doctor.hospital_name && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span>{doctor.hospital_name}</span>
                  </span>
                )}
                {doctor.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{doctor.city}</span>
                  </span>
                )}
              </div>
            )}
            <div className="mt-2">
              <RatingStars rating={doctor.rating_average} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              <Clock className="h-3.5 w-3.5" />
              <span>{t("modal.estResponse", { time: doctor.estimated_response_time })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Award className="mx-auto h-5 w-5 text-fcn-primary mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {doctor.years_experience}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{t("modal.experience")}</div>
          </div>
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Users className="mx-auto h-5 w-5 text-fcn-primary mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {doctor.total_consultations}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{t("modal.consultations")}</div>
          </div>
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 text-center">
            <DollarSign className="mx-auto h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1" />
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-xs text-slate-400 line-through font-semibold">{consultFee}</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">0 Br</span>
            </div>
            <div className="mt-1">
              <PilotBadge size="xs" variant="solid" />
            </div>
            <div className="text-[10px] text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">{t("common.consult")}</div>
          </div>
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Repeat className="mx-auto h-5 w-5 text-fcn-primary mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {followUpFee}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{t("common.followUp")}</div>
          </div>
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Star className="mx-auto h-5 w-5 text-fcn-warning mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {doctor.rating_average.toFixed(1)}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{t("modal.rating")}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-2">
            {t("modal.about", { name: firstName })}
          </h3>
          {doctor.bio ? (
            <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70 leading-relaxed">
              {doctor.bio}
            </p>
          ) : (
            <p className="text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40 italic">
              {t("modal.noBio")}
            </p>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <Languages className="h-3.5 w-3.5" />
            <span>
              {doctor.languages_spoken.length > 0 ? doctor.languages_spoken.join(", ") : "—"}
            </span>
          </div>
        </div>

        {doctor.recent_ratings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">
              {t("modal.recentRatings")}
            </h3>
            <div className="space-y-3">
              {doctor.recent_ratings.slice(0, 3).map((r) => (
                <AnonymizedRating key={r.id} rating={r} fallbackName={r.patient_name} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 border-t border-fcn-primary/10 pt-4">
        <Button variant="ghost" onClick={onClose} className="order-2 sm:order-1">
          {t("common.close")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onClose();
            handleMessage();
          }}
          className="order-3 sm:order-2"
          icon={<MessageCircle className="h-4 w-4" />}
        >
          {t("modal.message")}
        </Button>
        <Button
          onClick={() => {
            onClose();
            handleBook();
          }}
          className="order-4 sm:order-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold shadow-sm"
          icon={<CalendarPlus className="h-4 w-4" />}
        >
          Book Free Consultation
        </Button>
      </div>
    </Modal>
  );
};