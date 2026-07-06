import { z } from "zod";

export const CreateRefillRequestSchema = z.object({
  body: z.object({
    prescription_id: z.string().uuid("Invalid prescription ID"),
    patient_note: z.string().max(300, "Note too long").optional()
  })
});

export const RespondToRefillRequestSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "DECLINED"]),
    doctor_note: z.string().max(300, "Note too long").optional()
  })
});

export const VerifyQRSchema = z.object({
  body: z.object({
    qr_hash: z.string().min(1, "QR hash is required").optional(),
    rx_reference: z.string().optional(),
    pharmacy_id: z.string().optional()
  }).refine(
    (data) => data.qr_hash || data.rx_reference,
    { message: "Either qr_hash or rx_reference is required" }
  )
});

export const DispensePrescriptionSchema = z.object({
  body: z.object({
    prescription_id: z.string().uuid("Invalid prescription ID"),
    medications_dispensed: z.array(z.string()).min(1, "At least one medication must be dispensed"),
    notes: z.string().max(500, "Notes too long").optional(),
    pharmacy_id: z.string().optional()
  })
});

export const CreatePharmacySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    lat: z.number().optional(),
    lng: z.number().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    opening_hours: z.string().optional(),
    license_number: z.string().min(5, "License number must be at least 5 characters")
  })
});

export const UpdatePharmacySchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    location: z.string().min(3).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    opening_hours: z.string().optional(),
    license_number: z.string().min(5).optional(),
    is_partner: z.boolean().optional()
  })
});

export const UpdatePharmacyStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"])
  })
});

export const CreatePharmacyAdminSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  })
});

export const LinkPharmacyToHospitalSchema = z.object({
  body: z.object({
    hospital_id: z.string().uuid("Invalid hospital ID")
  })
});
