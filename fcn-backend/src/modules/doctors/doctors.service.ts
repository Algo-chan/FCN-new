import type { AvailabilityStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../utils/app-error";
import { uploadToCloudinary } from "../../middleware/upload.middleware";
import { MASTER_SPECIALTIES } from "../../constants/specialties";
import type { GetDoctorsQueryDto, UpdateDoctorProfileDto } from "./doctors.validators";

interface DoctorWithProfile {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  status: string;
  doctor_profile: {
    specialty: string;
    hospital_id: string | null;
    hospital_name: string | null;
    availability_status: AvailabilityStatus;
    bio: string | null;
    rating_average: number;
    rating_count: number;
    years_experience: number;
    consultation_fee_etb: number;
    photo_url: string | null;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  label: string;
}

interface DoctorDetail {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  status: string;
  doctor_profile: {
    specialty: string;
    hospital_id: string | null;
    hospital_name: string | null;
    availability_status: AvailabilityStatus;
    bio: string | null;
    rating_average: number;
    rating_count: number;
    years_experience: number;
    consultation_fee_etb: number;
    photo_url: string | null;
  } | null;
  recent_ratings: Array<{
    id: string;
    appointment_id: string;
    patient_id: string;
    doctor_id: string;
    rating: number;
    review_text: string | null;
    created_at: Date;
    patient: { full_name: string };
  }>;
  total_consultations: number;
  estimated_response_time: string;
}

export class DoctorsService {
  async getAllDoctors(query: GetDoctorsQueryDto, _requesterId: string): Promise<{
    doctors: DoctorWithProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { specialty, hospital_id, available_now, search, page, limit } = query;
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

    if (available_now !== undefined) {
      doctorProfileWhere.availability_status = available_now ? "available" : { not: "available" };
    }

    if (Object.keys(doctorProfileWhere).length > 0) {
      where.doctor_profile = doctorProfileWhere;
    }

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
              hospital: {
                select: { name: true }
              }
            }
          }
        }
      })
    ]);

    const doctors: DoctorWithProfile[] = users.map((u) => {
      const dp = u.doctor_profile!;
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        status: u.status,
        doctor_profile: {
          specialty: dp.specialty,
          hospital_id: dp.hospital_id,
          hospital_name: dp.hospital?.name ?? null,
          availability_status: dp.availability_status,
          bio: dp.bio,
          rating_average: Number(dp.rating_average),
          rating_count: dp.rating_count,
          years_experience: dp.years_experience,
          consultation_fee_etb: Number(dp.consultation_fee_etb),
          photo_url: dp.photo_url
        }
      };
    });

    return {
      doctors,
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
      select: {
        specialty: true
      },
      distinct: ["specialty"]
    });

    const specialties = result.map((r) => r.specialty).sort();
    return specialties;
  }

  async getDoctorById(id: string): Promise<DoctorDetail> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        doctor_profile: {
          include: {
            hospital: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!user || user.role !== "doctor") {
      throw new AppError("Doctor not found", 404, "NOT_FOUND");
    }

    const recentRatings = await prisma.consultationRating.findMany({
      where: { doctor_id: id },
      orderBy: { created_at: "desc" },
      take: 5,
      include: {
        patient: {
          select: { full_name: true }
        }
      }
    });

    const totalConsultations = await prisma.appointment.count({
      where: { doctor_id: id, status: "completed" }
    });

    const dp = user.doctor_profile;

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      doctor_profile: dp
        ? {
            specialty: dp.specialty,
            hospital_id: dp.hospital_id,
            hospital_name: dp.hospital?.name ?? null,
            availability_status: dp.availability_status,
            bio: dp.bio,
            rating_average: Number(dp.rating_average),
            rating_count: dp.rating_count,
            years_experience: dp.years_experience,
            consultation_fee_etb: Number(dp.consultation_fee_etb),
            photo_url: dp.photo_url
          }
        : null,
      recent_ratings: recentRatings.map((r) => ({
        id: r.id,
        appointment_id: r.appointment_id,
        patient_id: r.patient_id,
        doctor_id: r.doctor_id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        patient: { full_name: r.patient.full_name }
      })),
      total_consultations: totalConsultations,
      estimated_response_time: "~5 min"
    };
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<TimeSlot[]> {
    const startHour = 8;
    const endHour = 18;
    const slots: TimeSlot[] = [];

    const dateStart = new Date(`${date}T00:00:00.000Z`);
    const dateEnd = new Date(`${date}T23:59:59.999Z`);
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        scheduled_at: { gte: dateStart, lte: dateEnd },
        status: { not: "cancelled" }
      },
      select: { scheduled_at: true, duration_minutes: true }
    });

    const occupiedTimes = new Set<string>();
    for (const apt of appointments) {
      const aptStart = apt.scheduled_at.getTime();
      const aptEnd = aptStart + apt.duration_minutes * 60 * 1000;
      for (let t = aptStart; t < aptEnd; t += 30 * 60 * 1000) {
        occupiedTimes.add(new Date(t).toISOString().slice(11, 16));
      }
    }

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const slotDate = new Date(`${date}T${timeStr}:00.000Z`);
        const isPast = slotDate < now;
        const isOccupied = occupiedTimes.has(timeStr);

        const hour24 = parseInt(timeStr.slice(0, 2), 10);
        const ampm = hour24 >= 12 ? "PM" : "AM";
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const label = `${hour12}:${timeStr.slice(3)} ${ampm}`;

        slots.push({
          time: timeStr,
          available: !isPast && !isOccupied,
          label
        });
      }
    }

    return slots;
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
}

export const doctorsService = new DoctorsService();
