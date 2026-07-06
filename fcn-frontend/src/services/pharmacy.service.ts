import { api } from "@/services/api";
import type { ApiResponse, PrescriptionWithMedications, PrescriptionVerificationResult, RefillRequest, DispenseRecord, Pharmacy } from "@/types";

export const pharmacyAdminService = {
  createPharmacy: (data: { name: string; location: string; license_number: string; phone?: string }) =>
    api.post<ApiResponse<Pharmacy>>("/pharmacy/admin/pharmacies", data).then((r) => r.data),

  updatePharmacyStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Pharmacy>>(`/pharmacy/admin/pharmacies/${id}/status`, { status }).then((r) => r.data),

  createPharmacyAdmin: (pharmacyId: string, data: { full_name: string; email: string; password: string }) =>
    api.post<ApiResponse<any>>(`/pharmacy/admin/pharmacies/${pharmacyId}/admins`, data).then((r) => r.data),
};

export const pharmacyService = {
  getMyPrescriptions: () =>
    api.get<ApiResponse<PrescriptionWithMedications[]>>("/pharmacy/my-prescriptions").then((r) => r.data),

  getDoctorPrescriptions: () =>
    api.get<ApiResponse<PrescriptionWithMedications[]>>("/pharmacy/doctor/prescriptions").then((r) => r.data),

  getPrescriptionById: (id: string) =>
    api.get<ApiResponse<PrescriptionWithMedications>>(`/pharmacy/my-prescriptions/${id}`).then((r) => r.data),

  getPrescriptionQR: (id: string) =>
    api.get<ApiResponse<{ qrDataUrl: string; qrHash: string }>>(`/pharmacy/my-prescriptions/${id}/qr`).then((r) => r.data),

  createRefillRequest: (prescription_id: string, patient_note?: string) =>
    api.post<ApiResponse<RefillRequest>>("/pharmacy/refill-request", { prescription_id, patient_note }).then((r) => r.data),

  getDoctorRefillRequests: () =>
    api.get<ApiResponse<RefillRequest[]>>("/pharmacy/doctor/refill-requests").then((r) => r.data),

  respondToRefillRequest: (id: string, status: "APPROVED" | "DECLINED", doctor_note?: string) =>
    api.patch<ApiResponse<RefillRequest>>(`/pharmacy/doctor/refill-requests/${id}`, { status, doctor_note }).then((r) => r.data),

  verifyQR: (input: string, isRxRef = false, pharmacy_id?: string) =>
    api.post<ApiResponse<PrescriptionVerificationResult>>("/pharmacy/verify-qr", {
      ...(isRxRef ? { rx_reference: input } : { qr_hash: input }),
      pharmacy_id
    }).then((r) => r.data),

  dispensePrescription: (prescriptionId: string, data: { prescription_id: string; medications_dispensed: string[]; notes?: string; pharmacy_id?: string }) =>
    api.post<ApiResponse<DispenseRecord>>(`/pharmacy/dispense/${prescriptionId}`, data).then((r) => r.data),

  getDispenseHistory: (pharmacyId?: string) =>
    api.get<ApiResponse<DispenseRecord[]>>("/pharmacy/dispense-history", {
      params: pharmacyId ? { pharmacy_id: pharmacyId } : {}
    }).then((r) => r.data),

  getPharmacies: () =>
    api.get<ApiResponse<Pharmacy[]>>("/pharmacy/pharmacies").then((r) => r.data)
};
