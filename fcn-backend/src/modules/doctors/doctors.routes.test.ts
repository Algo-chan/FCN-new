import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { AppError } from "../../utils/app-error";
import { errorMiddleware } from "../../middleware/error.middleware";

const { isFeatureEnabledMock, serviceMock } = vi.hoisted(() => ({
  isFeatureEnabledMock: vi.fn(),
  serviceMock: {
    getPublicDoctors: vi.fn(),
    getAvailableSpecialties: vi.fn(),
    getAvailableCities: vi.fn(),
    getPublicDoctorById: vi.fn(),
    getDoctorAvailability: vi.fn()
  }
}));

vi.mock("../../utils/feature-flags", () => ({
  isFeatureEnabled: isFeatureEnabledMock
}));

vi.mock("./doctors.service", () => ({
  doctorsService: serviceMock
}));

import { doctorRoutes } from "./doctors.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/doctors", doctorRoutes);
app.use(errorMiddleware);

const publicCard = {
  id: "doctor-1",
  full_name: "Abebe Kebede",
  specialty: "General Medicine",
  city: "Dire Dawa",
  photo_url: null,
  languages_spoken: ["en", "am"],
  consultation_fee_etb: 350,
  follow_up_fee_etb: 250,
  rating_average: 4.5,
  rating_count: 12,
  verified: true,
  availability_status: "available",
  next_available_slot: "2026-01-02T08:00:00.000Z",
  hospital_name: "Dire Dawa General Hospital",
  hospital_location: "Dire Dawa"
};

const publicDetail = {
  ...publicCard,
  bio: "Experienced general practitioner.",
  years_experience: 8,
  clinic_address: "Kebele 03",
  consultation_types: ["remote", "in_person"],
  total_consultations: 40,
  estimated_response_time: "~5 min",
  recent_ratings: [
    { id: "r1", rating: 5, review_text: "Great doctor", created_at: "2026-08-01T10:00:00.000Z", patient_name: "Sara" }
  ]
};

describe("public doctor routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFeatureEnabledMock.mockReturnValue(true);
    serviceMock.getPublicDoctors.mockResolvedValue({
      doctors: [publicCard],
      total: 1,
      page: 1,
      totalPages: 1
    });
  });

  it("GET /api/v1/doctors returns 200 without auth and with pagination meta", async () => {
    const res = await request(app).get("/api/v1/doctors");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toMatchObject({
      id: "doctor-1",
      full_name: "Abebe Kebede"
    });
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
  });

  it("GET /api/v1/doctors forwards parsed filters to the service", async () => {
    await request(app).get(
      "/api/v1/doctors?city=Dire+Dawa&verified_only=true&available_today=true&min_fee=200&max_fee=500&language=en&page=2&limit=10"
    );
    expect(serviceMock.getPublicDoctors).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "Dire Dawa",
        verified_only: true,
        available_today: true,
        min_fee: 200,
        max_fee: 500,
        language: "en",
        page: 2,
        limit: 10
      })
    );
  });

  it("GET /api/v1/doctors/cities returns available cities", async () => {
    serviceMock.getAvailableCities.mockResolvedValue(["Dire Dawa", "Addis Ababa"]);
    const res = await request(app).get("/api/v1/doctors/cities");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(["Dire Dawa", "Addis Ababa"]);
  });

  it("GET /api/v1/doctors/:id returns 200 with a public profile that never exposes email or phone", async () => {
    serviceMock.getPublicDoctorById.mockResolvedValue(publicDetail);
    const res = await request(app).get("/api/v1/doctors/doctor-1");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "doctor-1", verified: true });
    expect(res.body.data).not.toHaveProperty("email");
    expect(res.body.data).not.toHaveProperty("phone");
  });

  it("GET /api/v1/doctors/:id returns the standard error shape when service throws AppError", async () => {
    serviceMock.getPublicDoctorById.mockRejectedValue(new AppError("Doctor not found", 404, "NOT_FOUND"));
    const res = await request(app).get("/api/v1/doctors/missing");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { code: "NOT_FOUND", message: "Doctor not found" } });
  });

  it("returns 422 with the standard error shape on invalid query", async () => {
    const res = await request(app).get("/api/v1/doctors?page=0");
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when the feature flag is disabled", async () => {
    isFeatureEnabledMock.mockReturnValue(false);
    const res = await request(app).get("/api/v1/doctors");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
  });
});