import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { QrCode, Hash, CheckCircle, XCircle, AlertTriangle, Search, User, Stethoscope, Calendar, Pill, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { pharmacyService } from "@/services/pharmacy.service";
import { formatDate } from "@/utils/formatters";
import type { PrescriptionVerificationResult } from "@/types";

type TabMode = "qr" | "rx";

export const QRScannerPortal = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess, playNotification } = useSound();
  const { addToast } = useNotifications();
  const [tab, setTab] = useState<TabMode>("qr");
  const [qrHash, setQrHash] = useState("");
  const [rxRef, setRxRef] = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [result, setResult] = useState<PrescriptionVerificationResult | null>(null);
  const [dispensed, setDispensed] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [dispenseNotes, setDispenseNotes] = useState("");

  const verifyMutation = useMutation({
    mutationFn: () => {
      const input = tab === "qr" ? qrHash : rxRef;
      return pharmacyService.verifyQR(input, tab === "rx", pharmacyId || undefined);
    },
    onSuccess: (res) => {
      setResult(res.data);
      if (res.data.valid) {
        playSuccess();
        setSelectedMeds(res.data.prescription?.medications.map((m) => `${m.drug_name} ${m.strength}`) ?? []);
      } else {
        playNotification();
      }
    },
    onError: (err: any) => {
      addToast({
        type: "danger",
        title: "Verification Failed",
        message: err?.response?.data?.error?.message ?? "Please try again"
      });
    }
  });

  const dispenseMutation = useMutation({
    mutationFn: () => {
      if (!result?.prescription) throw new Error("No prescription to dispense");
      return pharmacyService.dispensePrescription(
        result.prescription.id,
        {
          prescription_id: result.prescription.id,
          medications_dispensed: selectedMeds,
          notes: dispenseNotes || undefined,
          pharmacy_id: pharmacyId || undefined
        }
      );
    },
    onSuccess: () => {
      playSuccess();
      setDispensed(true);
      addToast({ type: "success", title: "Dispensed Successfully" });
      setTimeout(() => {
        setResult(null);
        setDispensed(false);
        setQrHash("");
        setRxRef("");
        setSelectedMeds([]);
        setDispenseNotes("");
      }, 5000);
    },
    onError: (err: any) => {
      addToast({
        type: "danger",
        title: "Dispense Failed",
        message: err?.response?.data?.error?.message ?? "Please try again"
      });
    }
  });

  const handleVerify = () => {
    setResult(null);
    setDispensed(false);
    verifyMutation.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Verify Prescription</h2>

        <div className="flex rounded-lg border border-fcn-primary/20 p-1">
          <button
            onClick={() => setTab("qr")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "qr"
                ? "bg-fcn-primary text-white"
                : "text-fcn-text-light/60 hover:text-fcn-primary dark:text-fcn-text-dark/60"
            }`}
          >
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </button>
          <button
            onClick={() => setTab("rx")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "rx"
                ? "bg-fcn-primary text-white"
                : "text-fcn-text-light/60 hover:text-fcn-primary dark:text-fcn-text-dark/60"
            }`}
          >
            <Hash className="h-4 w-4" />
            Enter RX Reference
          </button>
        </div>

        <div className="space-y-3">
          {tab === "qr" ? (
            <>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-fcn-primary/20 p-8">
                <div className="text-center">
                  <QrCode className="mx-auto h-12 w-12 text-fcn-primary/40" />
                  <p className="mt-2 text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                    QR camera scanning coming soon
                  </p>
                </div>
              </div>
              <label className="block text-sm font-medium">Or enter QR hash manually</label>
              <input
                value={qrHash}
                onChange={(e) => setQrHash(e.target.value)}
                placeholder="Paste QR hash here..."
                className="w-full rounded-lg border border-fcn-primary/20 bg-transparent p-3 text-sm font-mono focus:border-fcn-accent focus:outline-none"
              />
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium">RX Reference</label>
              <input
                value={rxRef}
                onChange={(e) => setRxRef(e.target.value.toUpperCase())}
                placeholder="RX-YYYYMMDD-NNN"
                className="w-full rounded-lg border border-fcn-primary/20 bg-transparent p-3 text-sm font-mono focus:border-fcn-accent focus:outline-none"
              />
              <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                Format: RX-YYYYMMDD-001
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Pharmacy ID (optional)</label>
            <input
              value={pharmacyId}
              onChange={(e) => setPharmacyId(e.target.value)}
              placeholder="Your pharmacy ID"
              className="w-full rounded-lg border border-fcn-primary/20 bg-transparent p-3 text-sm focus:border-fcn-accent focus:outline-none"
            />
          </div>

          <Button
            className="w-full"
            loading={verifyMutation.isPending}
            disabled={tab === "qr" ? !qrHash : !rxRef}
            onClick={handleVerify}
          >
            <Search className="h-4 w-4" />
            Verify
          </Button>
        </div>
      </Card>

      <div>
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.valid ? "valid" : "invalid"}
              initial={shouldReduceMotion ? false : result.valid ? { opacity: 0, scale: 0.8 } : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {result.valid && result.prescription ? (
                <Card glow className="space-y-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fcn-success/20">
                      <CheckCircle className="h-8 w-8 text-fcn-success" />
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-fcn-success">Valid Prescription</h3>
                  </div>

                  <div className="space-y-2 rounded-lg bg-fcn-primary/5 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-fcn-primary" />
                      <span>{result.prescription.patient_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-fcn-primary" />
                      <span>Prescribed by Dr. {result.prescription.doctor_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-fcn-primary" />
                      <span>Issued: {formatDate(result.prescription.issued_at)} | Expires: {formatDate(result.prescription.expires_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-fcn-primary" />
                      <span className="font-mono text-xs">{result.prescription.rx_reference}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium">Medications</h4>
                    <div className="space-y-1">
                      {result.prescription.medications.map((med, i) => (
                        <label
                          key={i}
                          className="flex cursor-pointer items-center gap-3 rounded-md bg-fcn-primary/5 p-2.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMeds.includes(`${med.drug_name} ${med.strength}`)}
                            onChange={() => {
                              const label = `${med.drug_name} ${med.strength}`;
                              setSelectedMeds((prev) =>
                                prev.includes(label)
                                  ? prev.filter((m) => m !== label)
                                  : [...prev, label]
                              );
                            }}
                            className="rounded border-fcn-primary/30 text-fcn-primary focus:ring-fcn-accent"
                          />
                          <Pill className="h-4 w-4 text-fcn-primary" />
                          <span>{med.drug_name} {med.strength}</span>
                          <span className="ml-auto text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">{med.instructions}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Pharmacist Notes (optional)</label>
                    <textarea
                      value={dispenseNotes}
                      onChange={(e) => setDispenseNotes(e.target.value)}
                      placeholder="Any notes about this dispense..."
                      className="mt-1 w-full rounded-lg border border-fcn-primary/20 bg-transparent p-2.5 text-sm focus:border-fcn-accent focus:outline-none"
                      rows={2}
                    />
                  </div>

                  {dispensed ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="rounded-lg bg-fcn-success/10 p-4 text-center"
                    >
                      <CheckCircle className="mx-auto h-10 w-10 text-fcn-success" />
                      <h3 className="mt-2 font-bold text-fcn-success">Dispensed Successfully</h3>
                      <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                        {result.prescription.patient_name} - {selectedMeds.join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                        {new Date().toLocaleString()}
                      </p>
                    </motion.div>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      loading={dispenseMutation.isPending}
                      disabled={selectedMeds.length === 0}
                      onClick={() => dispenseMutation.mutate()}
                    >
                      <CheckCircle className="h-5 w-5" />
                      Confirm Dispense
                    </Button>
                  )}
                </Card>
              ) : (
                <Card className="border-fcn-danger/30 space-y-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fcn-danger/20">
                      {result.reason === "expired" ? (
                        <AlertTriangle className="h-8 w-8 text-fcn-danger" />
                      ) : (
                        <XCircle className="h-8 w-8 text-fcn-danger" />
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-fcn-danger">
                      {result.reason === "expired" ? "Prescription Expired" :
                       result.reason === "not_found" ? "Prescription Not Found" :
                       result.reason === "already_dispensed" ? "Already Dispensed" :
                       result.reason === "cancelled" ? "Prescription Cancelled" :
                       "Invalid Prescription"}
                    </h3>
                    {result.message && (
                      <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                        {result.message}
                      </p>
                    )}
                    {result.reason === "not_found" && (
                      <p className="mt-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                        Check the RX reference and try again
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
