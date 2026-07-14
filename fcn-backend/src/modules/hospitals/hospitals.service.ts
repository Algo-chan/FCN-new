import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { emailService } from "../auth/email.service";
import type { CreateHospitalAdminDto, CreateHospitalDto, UpdateOccupancyDto } from "./hospitals.validators";

type OccupancyBand = "low" | "moderate" | "high";

interface HospitalWithOccupancy {
  id: string;
  name: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
  total_beds: number;
  occupied_beds: number;
  active_doctors_count: number;
  avg_wait_minutes: number;
  specialties: string[];
  status: string;
  data_feed_type: string;
  last_updated_at: Date;
  occupancy_percent: number;
  occupancy_band: OccupancyBand;
}

interface HospitalDetail extends HospitalWithOccupancy {
  recommendation: string;
}

const computeOccupancy = (totalBeds: number, occupiedBeds: number): { occupancy_percent: number; occupancy_band: OccupancyBand } => {
  const occupancy_percent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  let occupancy_band: OccupancyBand = "low";
  if (occupancy_percent > 75) {
    occupancy_band = "high";
  } else if (occupancy_percent >= 50) {
    occupancy_band = "moderate";
  }
  return { occupancy_percent, occupancy_band };
};

const getRecommendation = (band: OccupancyBand): string => {
  switch (band) {
    case "low":
      return "Good time to visit — short wait expected";
    case "moderate":
      return "Moderate wait — consider booking a remote consultation first";
    case "high":
      return "Very busy — we strongly recommend a remote FCN consultation first to avoid a long wait";
  }
};

const mapHospital = (h: { id: string; name: string; location: string; lat?: unknown; lng?: unknown; total_beds: number; occupied_beds: number; active_doctors_count: number; avg_wait_minutes: number; specialties: string[]; status: string; data_feed_type: string; last_updated_at: Date }): HospitalWithOccupancy => {
  const { occupancy_percent, occupancy_band } = computeOccupancy(h.total_beds, h.occupied_beds);
  return { ...h, lat: h.lat as number | null | undefined, lng: h.lng as number | null | undefined, occupancy_percent, occupancy_band };
};

export class HospitalsService {
  async getAllHospitals(statusFilter?: string): Promise<HospitalWithOccupancy[]> {
    const where = statusFilter ? { status: statusFilter as "active" | "pending" | "inactive" } : {};
    const hospitals = await prisma.hospital.findMany({ where, orderBy: { name: "asc" } });
    return hospitals.map(mapHospital);
  }

  async getHospitalById(id: string): Promise<HospitalDetail> {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      throw new AppError("Hospital not found", 404, "NOT_FOUND");
    }
    const mapped = mapHospital(hospital);
    return { ...mapped, recommendation: getRecommendation(mapped.occupancy_band) };
  }

  async updateOccupancy(hospitalId: string, data: UpdateOccupancyDto, requesterId: string, scopedHospitalId: string | null): Promise<HospitalWithOccupancy> {
    if (scopedHospitalId !== null && scopedHospitalId !== hospitalId) {
      throw new AppError("You can only update your own hospital's data", 403, "FORBIDDEN");
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        total_beds: data.total_beds,
        occupied_beds: data.occupied_beds,
        active_doctors_count: data.active_doctors_count,
        avg_wait_minutes: data.avg_wait_minutes,
        last_updated_at: new Date()
      }
    });

    return mapHospital(hospital);
  }

  async getHospitalSpecialties(hospitalId: string): Promise<string[]> {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      throw new AppError("Hospital not found", 404, "NOT_FOUND");
    }
    return hospital.specialties;
  }

  async createHospital(data: CreateHospitalDto) {
    const hospital = await prisma.hospital.create({
      data: {
        name: data.name,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        specialties: data.specialties,
        status: "pending",
        total_beds: 0,
        occupied_beds: 0,
        active_doctors_count: 0,
        avg_wait_minutes: 0,
        data_feed_type: "manual"
      }
    });
    return mapHospital(hospital);
  }

  async updateHospital(id: string, data: Partial<CreateHospitalDto>) {
    const hospital = await prisma.hospital.update({ where: { id }, data });
    return mapHospital(hospital);
  }

  async updateHospitalStatus(id: string, status: string) {
    const hospital = await prisma.hospital.update({
      where: { id },
      data: { status: status as "active" | "pending" | "inactive" }
    });
    return mapHospital(hospital);
  }

  async getHospitalAdmins(hospitalId: string) {
    const profiles = await prisma.hospitalAdminProfile.findMany({
      where: { hospital_id: hospitalId },
      include: {
        user: {
          select: { id: true, full_name: true, email: true, status: true }
        }
      },
      orderBy: { created_at: "desc" }
    });

    return profiles.map((p) => ({
      user_id: p.user_id,
      hospital_id: p.hospital_id,
      full_name: p.user.full_name,
      email: p.user.email,
      status: p.user.status,
      created_at: p.created_at
    }));
  }

  async createHospitalAdmin(data: CreateHospitalAdminDto, createdBy: string) {
    const hospital = await prisma.hospital.findUnique({ where: { id: data.hospital_id } });
    if (!hospital) {
      throw new AppError("Hospital not found", 404, "NOT_FOUND");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError("A user with this email already exists", 409, "CONFLICT");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          full_name: data.full_name,
          email: data.email,
          phone: null,
          password_hash: passwordHash,
          role: "hospital_admin",
          status: "active",
          email_verified: true,
          phone_verified: false
        }
      });

      await tx.hospitalAdminProfile.create({
        data: {
          user_id: created.id,
          hospital_id: data.hospital_id,
          created_by: createdBy
        }
      });

      return created;
    });

    await emailService.sendHospitalAdminWelcomeEmail(data.email, data.full_name, hospital.name, data.password);

    const { password_hash: _pw, ...safeUser } = user;
    return safeUser;
  }
}

export const hospitalsService = new HospitalsService();
