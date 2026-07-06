import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, Pill } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { pharmacyService } from "@/services/pharmacy.service";
import type { PrescriptionWithMedications } from "@/types";

interface RefillRequestModalProps {
  prescription: PrescriptionWithMedications;
  onSuccess: () => void;
  onClose: () => void;
}

export const RefillRequestModal = ({ prescription, onSuccess, onClose }: RefillRequestModalProps) => {
  const [patientNote, setPatientNote] = useState("");
  const queryClient = useQueryClient();
  const { playTransition } = useSound();
  const { addToast } = useNotifications();

  const mutation = useMutation({
    mutationFn: () => pharmacyService.createRefillRequest(prescription.id, patientNote || undefined),
    onSuccess: () => {
      playTransition();
      addToast({ type: "success", title: "Refill request submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["my-prescriptions"] });
      onSuccess();
    },
    onError: (err: any) => {
      addToast({
        type: "danger",
        title: "Failed to submit refill request",
        message: err?.response?.data?.error?.message ?? "Please try again"
      });
    }
  });

  return (
    <Modal isOpen onClose={onClose} title="Request Prescription Refill" size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-3">
          <p className="font-mono text-sm font-bold text-fcn-primary">{prescription.rx_reference}</p>
          <div className="mt-2 space-y-1">
            {prescription.medications.map((med) => (
              <div key={med.id} className="flex items-center gap-2 text-sm">
                <Pill className="h-3.5 w-3.5 text-fcn-primary" />
                <span>{med.drug_name} {med.strength}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            Prescribed by Dr. {prescription.doctor_name}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
            Any message for Dr. {prescription.doctor_name}?
          </label>
          <textarea
            value={patientNote}
            onChange={(e) => setPatientNote(e.target.value.slice(0, 300))}
            placeholder="e.g. Running low on medication, symptoms still present..."
            className="w-full rounded-lg border border-fcn-primary/20 bg-transparent p-3 text-sm focus:border-fcn-accent focus:outline-none focus:ring-1 focus:ring-fcn-accent"
            rows={3}
          />
          <p className="mt-1 text-right text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
            {patientNote.length}/300
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-fcn-primary/5 p-3 text-sm text-fcn-primary">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Your doctor will review this request and respond within 24 hours. You&apos;ll be notified when they respond.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Send Refill Request
          </Button>
        </div>
      </div>
    </Modal>
  );
};
