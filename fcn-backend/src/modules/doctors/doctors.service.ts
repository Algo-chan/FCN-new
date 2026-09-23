import type { AvailabilityStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../utils/app-error";
import { uploadToCloudinary } from "../../middleware/upload.middleware";
import { MASTER_SPECIALTIES } from "../../constants/specialties";
import type { GetDoctorsQueryDto, UpdateDoctorProfileDto } from "./doctors.validators";

export interface PublicDoctorCard {
  id: string;
  full_name: string;
  specialty: string;
  city: string | null;
  photo_url: string | null;
  languages_spoken: string[];
  consultation_fee_etb: number;
  follow_up_fee_etb: number | null;
  rating_average: number;
  rating_count: number;
  verified: boolean;
  availability_status: AvailabilityStatus;
  next_available_slot: string | null;
  hospital_name: string | null;
  hospital_location: string | null;
}

export interface PublicDoctorReview {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: Date;
  patient_name: string;
}

export interface PublicDoctorDetail extends PublicDoctorCard {
  bio: string | null;
  years_experience: number;
  clinic_address: string | null;
  consultation_types: string[];
  total_consultations: number;
  estimated_response_time: string;
  recent_ratings: PublicDoctorReview[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  label: string;
}

const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 18;
const SLOT_MINUTES = 30;
const NEXT_SLOT_LOOKAHEAD_DAYS = 7;

export function buildSlotsForDate(date: string, occupied: Set<string>, now: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const slotDate = new Date(`${date}T${timeStr}:00.000Z`);
      const isPast = slotDate < now;
      const isOccupied = occupied.has(timeStr);

      const hour24 = parseInt(timeStr.slice(0, 2), 10);
      const ampm = hour24 >= 12 ? "PM" : "AM";
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

      slots.push({
        time: timeStr,
        available: !isPast && !isOccupied,
        label: `${hour12}:${timeStr.slice(3)} ${ampm}`
      });
    }
  }
  return slots;
}

export function buildOccupiedByDate(
  appointments: Array<{ scheduled_at: Date; duration_minutes: number }>
): Map<string, Set<string>> {
  const byDate = new Map<string, Set<string>>();
  for (const apt of appointments) {
    const start = apt.scheduled_at.getTime();
    const end = start + apt.duration_minutes * 60 * 1000;
    for (let t = start; t < end; t += SLOT_MINUTES * 60 * 1000) {
      const d = new Date(t);
      const dayKey = d.toISOString().slice(0, 10);
      let times = byDate.get(dayKey);
      if (!times) {
        times = new Set<string>();
        byDate.set(dayKey, times);
      }
      times.add(d.toISOString().slice(11, 16));
    }
  }
  return byDate;
}

export function findFirstAvailableSlot(
  today: Date,
  lookaheadDays: number,
  occupiedByDate: Map<string, Set<string>>
): string | null {
  for (let i = 0; i < lookaheadDays; i++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + i);
    const dayKey = day.toISOString().slice(0, 10);
    const slots = buildSlotsForDate(dayKey, occupiedByDate.get(dayKey) ?? new Set(), today);
    const first = slots.find((s) => s.available);
    if (first) {
      return `${dayKey}T${first.time}:00.000Z`;
    }
  }
  return null;
}

interface DoctorWithProfileRow {
  id: string;
  full_name: string;
  doctor_profile: {
    specialty: string;
    hospital_id: string | null;
    availability_status: AvailabilityStatus;
    bio: string | null;
    rating_average: Prisma.Decimal;
    rating_count: number;
    years_experience: number;
    consultation_fee_etb: Prisma.Decimal;
    follow_up_fee_etb: Prisma.Decimal | null;
    city: string | null;
    verified: boolean;
    languages_spoken: string[];
    clinic_address: string | null;
    consultation_types: string[];
    photo_url: string | null;
    hospital: { name: string; location: string } | null;
  } | null;
}

export class DoctorsService {
  async getPublicDoctors(query: GetDoctorsQueryDto): Promise<{
    doctors: PublicDoctorCard[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { specialty, hospital_id, city, min_fee, max_fee, language, available_today, available_now, verified_only, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: "doctor",
      status: "active"
    };

    const doctorProfileWhere: Prisma.DoctorProfileWhereInput = {};

    if (specialty) {
      doctorProfileWhere.specialty = specialty;
    }
    if (hospital_id) {
      doctorProfileWhere.hospital_id = hospital_id;
    }
    if (city) {
      doctorProfileWhere.city = { contains: city, mode: "insensitive" };
    }
    if (min_fee !== undefined || max_fee !== undefined) {
      const feeFilter: Prisma.DecimalFilter = {};
      if (min_fee !== undefined) feeFilter.gte = min_fee;
      if (max_fee !== undefined) feeFilter.lte = max_fee;
      doctorProfileWhere.consultation_fee_etb = feeFilter;
    }
    if (language) {
      doctorProfileWhere.languages_spoken = { has: language };
    }
    const availabilityRequested = available_today ?? available_now;
    if (availabilityRequested !== undefined) {
      doctorProfileWhere.availability_status = availabilityRequested ? "available" : { not: "available" };
    }
    if (verified_only) {
      doctorProfileWhere.verified = true;
    }

    where.doctor_profile = doctorProfileWhere;

    if (search) {
      where.AND = {
        full_name: { contains: search, mode: "insensitive" }
      };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { doctor_profile: { availability_status: "asc" } },
          { full_name: "asc" }
        ],
        include: {
          doctor_profile: {
            include: {
              hospital: { select: { name: true, location: true } }
            }
          }
        }
      })
    ]);

    const doctors = users.map((u) => this.mapPublicCard(u));
    const withSlots = await this.attachNextAvailableSlots(doctors);

    return {
      doctors: withSlots,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAvailableSpecialties(): Promise<string[]> {
    const result = await prisma.doctorProfile.findMany({
      where: {
        user: {
          role: "doctor",
          status: "active"
        }
      },
      select: { specialty: true },
      distinct: ["specialty"]
    });

    return result.map((r) => r.specialty).sort();
  }

  async getAvailableCities(): Promise<string[]> {
    const result = await prisma.doctorProfile.findMany({
      where: {
        city: { not: null },
        user: {
          role: "doctor",
          status: "active"
        }
      },
      select: { city: true },
      distinct: ["city"]
    });

    return result
      .map((r) => r.city)
      .filter((city): city is string => Boolean(city))
      .sort();
  }

  async getPublicDoctorById(id: string): Promise<PublicDoctorDetail> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        doctor_profile: {
          include: {
            hospital: { select: { name: true, location: true } }
          }
        }
      }
    });

    if (!user || user.role !== "doctor" || !user.doctor_profile) {
      throw new AppError("Doctor not found", 404, "NOT_FOUND");
    }

    const [recentRatings, totalConsultations] = await Promise.all([
      prisma.consultationRating.findMany({
        where: { doctor_id: id },
        orderBy: { created_at: "desc" },
        take: 5,
        include: { patient: { select: { full_name: true } } }
      }),
      prisma.appointment.count({
        where: { doctor_id: id, status: "completed" }
      })
    ]);

    const dp = user.doctor_profile;
    const nextAvailableSlot = await this.computeNextAvailableSlot(id);

    return {
      ...this.mapPublicCard(user),
      next_available_slot: nextAvailableSlot,
      bio: dp.bio,
      years_experience: dp.years_experience,
      clinic_address: dp.clinic_address,
      consultation_types: dp.consultation_types,
      total_consultations: totalConsultations,
      estimated_response_time: "~5 min",
      recent_ratings: recentRatings.map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        patient_name: r.patient.full_name
      }))
    };
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<TimeSlot[]> {
    const dateStart = new Date(`${date}T00:00:00.000Z`);
    const dateEnd = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        scheduled_at: { gte: dateStart, lte: dateEnd },
        status: { not: "cancelled" }
      },
      select: { scheduled_at: true, duration_minutes: true }
    });

    const occupied = buildOccupiedByDate(appointments).get(date) ?? new Set<string>();
    return buildSlotsForDate(date, occupied, new Date());
  }

  async updateAvailabilityStatus(doctorId: string, status: AvailabilityStatus): Promise<void> {
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: doctorId } });
    if (!profile) {
      throw new AppError("Doctor profile not found", 404, "NOT_FOUND");
    }

    const wasAvailable = profile.availability_status === "available";
    const becomingAvailable = status === "available";

    await prisma.doctorProfile.update({
      where: { user_id: doctorId },
      data: {
        availability_status: status,
        available_since: becomingAvailable ? new Date() : wasAvailable ? null : undefined
      }
    });
  }

  async updateDoctorProfile(doctorId: string, data: UpdateDoctorProfileDto): Promise<void> {
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: doctorId } });
    if (!profile) {
      throw new AppError("Doctor profile not found", 404, "NOT_FOUND");
    }

    if (data.specialty && !(MASTER_SPECIALTIES as readonly string[]).includes(data.specialty)) {
      throw new AppError("Invalid specialty", 400, "INVALID_SPECIALTY");
    }

    const updateData: Prisma.DoctorProfileUpdateInput = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.years_experience !== undefined) updateData.years_experience = data.years_experience;
    if (data.consultation_fee_etb !== undefined) updateData.consultation_fee_etb = data.consultation_fee_etb;
    if (data.follow_up_fee_etb !== undefined) updateData.follow_up_fee_etb = data.follow_up_fee_etb;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.languages_spoken !== undefined) updateData.languages_spoken = data.languages_spoken;
    if (data.specialty !== undefined) updateData.specialty = data.specialty;

    await prisma.doctorProfile.update({
      where: { user_id: doctorId },
      data: updateData
    });
  }

  async uploadProfilePhoto(doctorId: string, fileBuffer: Buffer, _mimetype: string): Promise<{ photo_url: string }> {
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: doctorId } });
    if (!profile) {
      throw new AppError("Doctor profile not found", 404, "NOT_FOUND");
    }

    if (profile.photo_public_id) {
      await cloudinary.uploader.destroy(profile.photo_public_id);
    }

    const result = await uploadToCloudinary(fileBuffer, {
      folder: "fcn/doctor-photos",
      public_id: `doctor-${doctorId}`,
      transformation: {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        format: "webp"
      }
    });

    await prisma.doctorProfile.update({
      where: { user_id: doctorId },
      data: {
        photo_url: result.secure_url,
        photo_public_id: result.public_id
      }
    });

    return { photo_url: result.secure_url };
  }

  async deleteProfilePhoto(doctorId: string): Promise<void> {
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: doctorId } });
    if (!profile) {
      throw new AppError("Doctor profile not found", 404, "NOT_FOUND");
    }

    if (profile.photo_public_id) {
      await cloudinary.uploader.destroy(profile.photo_public_id);
    }

    await prisma.doctorProfile.update({
      where: { user_id: doctorId },
      data: {
        photo_url: null,
        photo_public_id: null
      }
    });
  }

  private mapPublicCard(user: DoctorWithProfileRow): PublicDoctorCard {
    if (!user.doctor_profile) {
      throw new AppError("Doctor profile not found", 404, "NOT_FOUND");
    }
    const dp = user.doctor_profile;
    return {
      id: user.id,
      full_name: user.full_name,
      specialty: dp.specialty,
      city: dp.city,
      photo_url: dp.photo_url,
      languages_spoken: dp.languages_spoken,
      consultation_fee_etb: Number(dp.consultation_fee_etb),
      follow_up_fee_etb: dp.follow_up_fee_etb === null ? null : Number(dp.follow_up_fee_etb),
      rating_average: Number(dp.rating_average),
      rating_count: dp.rating_count,
      verified: dp.verified,
      availability_status: dp.availability_status,
      next_available_slot: null,
      hospital_name: dp.hospital?.name ?? null,
      hospital_location: dp.hospital?.location ?? null
    };
  }

  private async attachNextAvailableSlots(cards: PublicDoctorCard[]): Promise<PublicDoctorCard[]> {
    if (cards.length === 0) return cards;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + NEXT_SLOT_LOOKAHEAD_DAYS);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: { in: cards.map((c) => c.id) },
        scheduled_at: { gte: today, lt: windowEnd },
        status: { not: "cancelled" }
      },
      select: { doctor_id: true, scheduled_at: true, duration_minutes: true }
    });

    const byDoctor = new Map<string, Array<{ scheduled_at: Date; duration_minutes: number }>>();
    for (const apt of appointments) {
      const list = byDoctor.get(apt.doctor_id) ?? [];
      list.push(apt);
      byDoctor.set(apt.doctor_id, list);
    }

    return cards.map((card) => {
      const occupiedByDate = buildOccupiedByDate(byDoctor.get(card.id) ?? []);
      return {
        ...card,
        next_available_slot: findFirstAvailableSlot(today, NEXT_SLOT_LOOKAHEAD_DAYS, occupiedByDate)
      };
    });
  }

  private async computeNextAvailableSlot(doctorId: string): Promise<string | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + NEXT_SLOT_LOOKAHEAD_DAYS);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        scheduled_at: { gte: today, lt: windowEnd },
        status: { not: "cancelled" }
      },
      select: { scheduled_at: true, duration_minutes: true }
    });

    return findFirstAvailableSlot(today, NEXT_SLOT_LOOKAHEAD_DAYS, buildOccupiedByDate(appointments));
  }
}

export const doctorsService = new DoctorsService();