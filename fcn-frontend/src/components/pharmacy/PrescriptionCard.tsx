import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, ChevronDown, ChevronUp, Clock, Pill, Printer, ShieldAlert, Timer, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QRDisplayModal } from "@/components/pharmacy/QRDisplayModal";
import { RefillRequestModal } from "@/components/pharmacy/RefillRequestModal";
import { formatDate } from "@/utils/formatters";
import type { PrescriptionWithMedications } from "@/types";

interface PrescriptionCardProps {
  prescription: PrescriptionWithMedications;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral"; icon?: string }> = {
  active: { label: "Active", variant: "success" },
  refill_due: { label: "Refill Due", variant: "warning" },
  expired: { label: "Expired", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  dispensed: { label: "Dispensed", variant: "info" }
};

export const PrescriptionCard = ({ prescription }: PrescriptionCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showDispenseHistory, setShowDispenseHistory] = useState(false);

  const statusInfo = statusConfig[prescription.status] ?? { label: prescription.status, variant: "neutral" as const };

  const daysRemaining = prescription.status !== "expired" && prescription.status !== "cancelled"
    ? Math.ceil((new Date(prescription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const canRequestRefill = (prescription.status === "refill_due" || prescription.status === "active")
    && prescription.refill_count < prescription.max_refills;

  const hasPendingRefill = prescription.refill_requests?.some((r) => r.status === "PENDING");

  const pendingRefill = prescription.refill_requests?.find((r) => r.status === "PENDING");

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Prescription QR - ${prescription.rx_reference}</title>
      <style>body{font-family:sans-serif;padding:40px;text-align:center}
      img{max-width:300px;margin:20px auto}
      h2{margin:10px 0;color:#0A7EA4}
      p{margin:4px 0;color:#475569}
      .rx{font-family:monospace;font-size:20px;color:#0D1B3E}</style></head>
      <body>
        <h1 style="color:#1E293B">FCN Prescription</h1>
        <p class="rx">${prescription.rx_reference}</p>
        <div id="qr">Loading QR...</div>
        <p>Dr. ${prescription.doctor_name}</p>
        <p>Valid until ${formatDate(prescription.expires_at)}</p>
        <script>
          fetch('/api/v1/pharmacy/my-prescriptions/${prescription.id}/qr', {
            headers: { Authorization: 'Bearer ${localStorage.getItem("access_token")}' }
          }).then(r=>r.json()).then(d=>{
            document.getElementById('qr').innerHTML='<img src="'+d.data.qrDataUrl+'" />';
            setTimeout(()=>window.print(),500);
          });
        </script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-fcn-primary">
                {prescription.rx_reference}
              </h3>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          {/* Status Timeline */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              <span className="flex h-2 w-2 rounded-full bg-fcn-success" />
              <span>Issued by Dr. {prescription.doctor_name} on {formatDate(prescription.issued_at)}</span>
            </div>
            {prescription.status !== "cancelled" && prescription.status !== "expired" && (
              <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                <span className={clsx("flex h-2 w-2 rounded-full",
                  prescription.status === "active" ? "bg-fcn-success" :
                  prescription.status === "refill_due" ? "bg-fcn-warning" : "bg-fcn-primary"
                )} />
                <span>
                  {prescription.status === "active" ? "Active" :
                   prescription.status === "refill_due" ? "Refill due" : "Active"}
                  {daysRemaining !== null && ` — expires ${formatDate(prescription.expires_at)}`}
                </span>
              </div>
            )}
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                <Timer className="h-3 w-3" />
                <span>{daysRemaining} days remaining</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Prescribed by Dr. {prescription.doctor_name} ({prescription.doctor_specialty})
            </span>
          </div>
          <div className="flex gap-4 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <span>Issued: {formatDate(prescription.issued_at)}</span>
            <span>Expires: {formatDate(prescription.expires_at)}</span>
          </div>

          <div className="space-y-2">
            {prescription.medications.map((med) => (
              <div key={med.id} className="flex items-center gap-3 rounded-md bg-fcn-primary/5 p-2.5">
                <Pill className="h-4 w-4 shrink-0 text-fcn-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {med.drug_name} {med.strength}
                  </p>
                  <p className="truncate text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                    {med.instructions.length > 60
                      ? `${med.instructions.slice(0, 60)}...`
                      : med.instructions}
                  </p>
                  {med.reminder_times && med.reminder_times.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-fcn-accent">
                      ⏰ Reminders: {med.reminder_times.join(" · ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                  {med.is_ongoing ? "Ongoing" : `${med.supply_days} days`}
                </span>
              </div>
            ))}
          </div>

          {daysRemaining !== null && daysRemaining <= 5 && prescription.status !== "refill_due" && (
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs font-medium text-fcn-warning"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {daysRemaining} days remaining
            </motion.p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowQRModal(true)}>
              Show QR at Pharmacy
            </Button>
            <Button size="sm" variant="ghost" icon={<Printer className="h-4 w-4" />} onClick={printQR}>
              Print
            </Button>

            {canRequestRefill && (
              <Button size="sm" variant="secondary" onClick={() => setShowRefillModal(true)}>
                Request Refill
              </Button>
            )}

            {hasPendingRefill && pendingRefill && (
              <div className="w-full rounded-md bg-fcn-warning/5 p-2 text-xs">
                <div className="flex items-center gap-1.5 text-fcn-warning">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">Refill Requested</span>
                </div>
                <p className="mt-0.5 text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  Refill requested {getTimeAgo(pendingRefill.requested_at)}
                </p>
                <p className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  ⏳ Awaiting Dr. {prescription.doctor_name}'s approval
                </p>
                <p className="text-[11px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                  Estimated response: Usually within 24h
                </p>
              </div>
            )}

            {prescription.refill_count >= prescription.max_refills && prescription.max_refills > 0 && (
              <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                No refills remaining — book a new consultation
              </p>
            )}
          </div>

          {prescription.dispense_records && prescription.dispense_records.length > 0 && (
            <div className="border-t border-fcn-primary/10 pt-3">
              <button
                onClick={() => setShowDispenseHistory(!showDispenseHistory)}
                className="flex items-center gap-1 text-xs text-fcn-text-light/50 hover:text-fcn-primary dark:text-fcn-text-dark/50"
              >
                Dispensed {prescription.dispense_count} time(s)
                {showDispenseHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showDispenseHistory && (
                <motion.div
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-2 space-y-1.5"
                >
                  {prescription.dispense_records.map((dr) => (
                    <div key={dr.id} className="flex items-center gap-2 rounded bg-fcn-primary/5 p-2 text-xs">
                      <Clock className="h-3 w-3 text-fcn-primary" />
                      <span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                        {dr.pharmacy_name ?? "Pharmacy"} - {formatDate(dr.dispensed_at)}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {showQRModal && (
        <QRDisplayModal
          prescriptionId={prescription.id}
          onClose={() => setShowQRModal(false)}
        />
      )}
      {showRefillModal && (
        <RefillRequestModal
          prescription={prescription}
          onSuccess={() => setShowRefillModal(false)}
          onClose={() => setShowRefillModal(false)}
        />
      )}
    </>
  );
};
