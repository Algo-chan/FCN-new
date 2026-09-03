import { Router } from "express";
import { prisma } from "../../config/database";
import { successResponse } from "../../utils/response";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string) || "";
    const query = q.trim();

    if (!query) {
      return successResponse(res, { query: "", results: [] });
    }

    const [hospitals, doctors, specialties] = await Promise.all([
      prisma.hospital.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } }
          ]
        },
        select: { id: true, name: true, location: true },
        take: 10
      }),
      prisma.user.findMany({
        where: {
          role: "doctor",
          status: "active",
          is_deleted: false,
          doctor_profile: {
            isNot: null
          },
          OR: [
            { full_name: { contains: query, mode: "insensitive" } },
            { doctor_profile: { specialty: { contains: query, mode: "insensitive" } } },
            { doctor_profile: { bio: { contains: query, mode: "insensitive" } } }
          ]
        },
        select: {
          id: true,
          full_name: true,
          doctor_profile: {
            select: { specialty: true, hospital: { select: { name: true } } }
          }
        },
        take: 10
      }),
      prisma.doctorProfile.findMany({
        where: {
          specialty: { contains: query, mode: "insensitive" }
        },
        select: { specialty: true },
        distinct: ["specialty"],
        take: 10
      })
    ]);

    return successResponse(res, {
      query,
      results: {
        hospitals,
        doctors,
        specialties: specialties.map((s) => s.specialty)
      }
    });
  } catch (err) {
    return next(err);
  }
});

export const searchRoutes = router;
