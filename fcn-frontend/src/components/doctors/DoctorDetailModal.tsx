import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  Building2, CalendarPlus, Clock, Languages, MessageCircle, Star, Users,
  Award, DollarSign
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import type { DoctorFullProfile, ConsultationRating } from "@/types";

interface DoctorDetailModalProps {
  doctor: DoctorFullProfile | null;
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

const statusLabel = (status: string) => {
  switch (status) {
    case "available": return "Available";
    case "in_session": return "In Session";
    default: return "Unavailable";
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

const AnonymizedRating = ({ rating }: { rating: ConsultationRating }) => {
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
          {new Date(rating.created_at).toLocaleDateString()}
        </span>
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

  const p = doctor.doctor_profile;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div ref={photoRef} className="flex-shrink-0">
            <div className="h-[120px] w-[120px] rounded-2xl overflow-hidden">
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={doctor.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlaceholder
                  query={`Ethiopian doctor professional portrait, medical setting, ${p.specialty}`}
                  alt={doctor.full_name}
                  aspectRatio="1/1"
                  rounded="2xl"
                  className="h-full w-full"
                />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Dr. {doctor.full_name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">{p.specialty}</Badge>
              <Badge variant={statusBadgeVariant(p.availability_status)} size="sm">
                {statusLabel(p.availability_status)}
              </Badge>
            </div>
            {p.hospital_name && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{p.hospital_name}</span>
              </div>
            )}
            <div className="mt-2">
              <RatingStars rating={p.rating_average} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              <Clock className="h-3.5 w-3.5" />
              <span>Est. response: {doctor.estimated_response_time}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Award className="mx-auto h-5 w-5 text-fcn-primary mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {p.years_experience}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Experience</div>
          </div>
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Users className="mx-auto h-5 w-5 text-fcn-primary mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {doctor.total_consultations}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Consultations</div>
          </div>
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <DollarSign className="mx-auto h-5 w-5 text-fcn-primary mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {p.consultation_fee_etb}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Fee (ETB)</div>
          </div>
          <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3 text-center">
            <Star className="mx-auto h-5 w-5 text-fcn-warning mb-1" />
            <div className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {p.rating_average.toFixed(1)}
            </div>
            <div className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Rating</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-2">
            About Dr. {firstName}
          </h3>
          {p.bio ? (
            <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70 leading-relaxed">
              {p.bio}
            </p>
          ) : (
            <p className="text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40 italic">
              This doctor hasn&apos;t added a bio yet
            </p>
          )}
          {/* TODO: languages field not yet in schema — add languages String[] to doctor_profiles */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <Languages className="h-3.5 w-3.5" />
            <span>Amharic, English</span>
          </div>
        </div>

        {doctor.recent_ratings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">
              Recent Ratings
            </h3>
            <div className="space-y-3">
              {doctor.recent_ratings.slice(0, 3).map((r) => (
                <AnonymizedRating key={r.id} rating={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 border-t border-fcn-primary/10 pt-4">
        <Button variant="ghost" onClick={onClose} className="order-2 sm:order-1">
          Close
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onClose();
            navigate(`/consultation/${doctor.id}`);
          }}
          className="order-3 sm:order-2"
          icon={<MessageCircle className="h-4 w-4" />}
        >
          Message
        </Button>
        <Button
          onClick={() => {
            onClose();
            navigate(`/appointments/book?doctor_id=${doctor.id}`);
          }}
          className="order-4 sm:order-3"
          icon={<CalendarPlus className="h-4 w-4" />}
        >
          Book Now
        </Button>
      </div>
    </Modal>
  );
};
