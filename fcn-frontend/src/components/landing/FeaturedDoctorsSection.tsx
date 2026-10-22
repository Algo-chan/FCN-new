import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Star,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CalendarPlus,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PilotBadge } from "@/components/ui/PilotBadge";
import { doctorsService } from "@/services/doctors.service";
import { useAuthStore } from "@/store/auth.store";
import { clsx } from "clsx";
import type { PublicDoctorCard } from "@/types";

const FALLBACK_DOCTORS: PublicDoctorCard[] = [
  {
    id: "doc-1",
    full_name: "Dr. Abebe Bekele",
    specialty: "General Medicine",
    years_experience: 12,
    hospital_name: "Dil Chora Referral Hospital",
    hospital_location: "Dire Dawa",
    city: "Dire Dawa",
    rating_average: 4.9,
    rating_count: 128,
    consultation_fee_etb: 350,
    follow_up_fee_etb: 150,
    photo_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80",
    languages_spoken: ["Amharic", "English", "Afaan Oromoo"],
    verified: true,
    availability_status: "available",
    next_available_slot: new Date(Date.now() + 3600000).toISOString()
  },
  {
    id: "doc-2",
    full_name: "Dr. Sara Tadesse",
    specialty: "Pediatrics",
    years_experience: 8,
    hospital_name: "Dil Chora Referral Hospital",
    hospital_location: "Dire Dawa",
    city: "Dire Dawa",
    rating_average: 4.8,
    rating_count: 94,
    consultation_fee_etb: 400,
    follow_up_fee_etb: 200,
    photo_url: "https://images.unsplash.com/photo-1594824813515-5d97f26d2db1?w=600&auto=format&fit=crop&q=80",
    languages_spoken: ["Amharic", "English", "Somali"],
    verified: true,
    availability_status: "available",
    next_available_slot: new Date(Date.now() + 7200000).toISOString()
  },
  {
    id: "doc-3",
    full_name: "Dr. Muluken Assefa",
    specialty: "General Surgery",
    years_experience: 15,
    hospital_name: "Sabian General Hospital",
    hospital_location: "Dire Dawa",
    city: "Dire Dawa",
    rating_average: 4.9,
    rating_count: 142,
    consultation_fee_etb: 500,
    follow_up_fee_etb: 200,
    photo_url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80",
    languages_spoken: ["Amharic", "English"],
    verified: true,
    availability_status: "available",
    next_available_slot: new Date(Date.now() + 10800000).toISOString()
  }
];

export const FeaturedDoctorsSection = () => {
  const [doctors, setDoctors] = useState<PublicDoctorCard[]>(FALLBACK_DOCTORS);
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    doctorsService
      .getAllDoctors({ limit: 3, verified_only: true })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setDoctors(res.data);
        }
      })
      .catch(() => {
        // Graceful fallback to verified sample doctors
      });
  }, []);

  const handleConsult = (doctorId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/appointments/book?doctor_id=${doctorId}` } });
      return;
    }
    navigate(`/appointments/book?doctor_id=${doctorId}`);
  };

  return (
    <section id="doctors" className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-fcn-dark dark:via-white/[0.01] dark:to-fcn-dark border-b border-fcn-primary/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 mb-4 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>TRANSPARENT PRICING · PILOT LAUNCH</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Consult Top Doctors{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              from 350 Br
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
            Know what you pay before you book. Every specialist displays upfront fees — and during our pilot launch,{" "}
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              all consultations are 100% FREE 🎉
            </span>
          </p>

          {/* Pilot announcement pill */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-900/80 px-4 py-2 border border-slate-200/80 dark:border-white/10 shadow-xs text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pilot Offer Active:</span>
            <span className="font-bold text-slate-400 line-through">from 350 Br</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">0 Br</span>
            <PilotBadge size="xs" variant="solid" />
          </div>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {doctors.slice(0, 3).map((doctor, index) => {
            const fee = doctor.consultation_fee_etb || 350;
            return (
              <motion.div
                key={doctor.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative flex flex-col rounded-[24px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
              >
                {/* Photo & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={doctor.photo_url || FALLBACK_DOCTORS[index % FALLBACK_DOCTORS.length].photo_url!}
                    alt={doctor.full_name}
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                  {/* Top Left Pilot Badge */}
                  <div className="absolute top-3 left-3">
                    <PilotBadge size="xs" variant="solid" />
                  </div>

                  {/* Top Right Verified */}
                  {doctor.verified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-600/90 backdrop-blur-md text-[11px] font-bold text-white shadow-sm">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      <span>Verified Doctor</span>
                    </div>
                  )}

                  {/* Bottom Chip: Availability */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-[11px] font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Available Today</span>
                  </div>

                  {/* Bottom Right: Rating */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-amber-400 text-xs font-bold bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{Number(doctor.rating_average || 4.9).toFixed(1)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {doctor.full_name}
                    </h3>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                      {doctor.specialty}
                    </p>
                  </div>

                  {/* Hospital & Location */}
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doctor.hospital_name || "Dil Chora Referral Hospital"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span>{doctor.city || "Dire Dawa"}</span>
                    </div>
                  </div>

                  {/* Prominent Pricing Block */}
                  <div className="mt-auto rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 p-3.5 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Consultation Fee
                        </p>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 line-through font-semibold">
                            {fee} Br
                          </span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            0 Br
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <PilotBadge size="xs" variant="glow" />
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          No credit card needed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Languages & Experience */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Languages</span>
                      <span className="truncate block">{doctor.languages_spoken?.slice(0, 2).join(", ") || "Amharic, English"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                      <span>{doctor.years_experience || 10}+ Years</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    type="button"
                    variant="action"
                    onClick={() => handleConsult(doctor.id)}
                    className="w-full min-h-[44px] text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    <span>Book Free Consultation</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-80 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA to view all doctors */}
        <div className="mt-12 text-center">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
          >
            <span>View All Ethiopian Specialists & Compare Fees</span>
            <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Over 15+ verified doctors across Pediatrics, Cardiology, General Medicine, and Surgery
          </p>
        </div>
      </div>
    </section>
  );
};
