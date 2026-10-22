import { create } from "zustand";
import type { MatchedDoctor } from "@/services/instant-consult.service";

export type InstantConsultStep = "finding" | "found" | "no_doctor" | "ready";

interface InstantConsultState {
  isOpen: boolean;
  step: InstantConsultStep;
  appointmentId: string | null;
  doctor: MatchedDoctor | null;
  queuePosition: number;
  estimatedWaitMinutes: number;
  nextAvailableDoctors: MatchedDoctor[];
  allergiesNote: string;
  chiefComplaint: string;
  isLoading: boolean;
  error: string | null;
}

interface InstantConsultActions {
  openInstantConsult: (initialComplaint?: string) => void;
  closeInstantConsult: () => void;
  setStep: (step: InstantConsultStep) => void;
  setDoctorFound: (doctor: MatchedDoctor, appointmentId: string) => void;
  setNoDoctor: (queuePosition: number, estimatedWaitMinutes: number, nextAvailable?: MatchedDoctor[]) => void;
  setQueueUpdate: (queuePosition: number, estimatedWaitMinutes: number) => void;
  setAllergiesNote: (note: string) => void;
  setChiefComplaint: (complaint: string) => void;
  setError: (err: string | null) => void;
  reset: () => void;
}

const initialState: InstantConsultState = {
  isOpen: false,
  step: "finding",
  appointmentId: null,
  doctor: null,
  queuePosition: 1,
  estimatedWaitMinutes: 5,
  nextAvailableDoctors: [],
  allergiesNote: "",
  chiefComplaint: "",
  isLoading: false,
  error: null
};

export const useInstantConsultStore = create<InstantConsultState & InstantConsultActions>((set) => ({
  ...initialState,

  openInstantConsult: (initialComplaint = "") => {
    set({
      isOpen: true,
      step: "finding",
      chiefComplaint: initialComplaint,
      allergiesNote: "",
      error: null
    });
  },

  closeInstantConsult: () => {
    set({ isOpen: false });
  },

  setStep: (step) => {
    set({ step });
  },

  setDoctorFound: (doctor, appointmentId) => {
    set({
      step: "found",
      doctor,
      appointmentId,
      isLoading: false
    });
  },

  setNoDoctor: (queuePosition, estimatedWaitMinutes, nextAvailable = []) => {
    set({
      step: "no_doctor",
      queuePosition,
      estimatedWaitMinutes,
      nextAvailableDoctors: nextAvailable,
      isLoading: false
    });
  },

  setQueueUpdate: (queuePosition, estimatedWaitMinutes) => {
    set({ queuePosition, estimatedWaitMinutes });
  },

  setAllergiesNote: (allergiesNote) => {
    set({ allergiesNote });
  },

  setChiefComplaint: (chiefComplaint) => {
    set({ chiefComplaint });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  reset: () => {
    set(initialState);
  }
}));
