import { QRScannerPortal } from "@/components/pharmacy/QRScannerPortal";
import { PageHeader } from "@/components/ui/PageHeader";
import { QrCode } from "lucide-react";

const PharmacyVerifyPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Prescription Scanner & Verification"
      description="Scan patient digital RX QR codes or input reference IDs to instantly verify authenticity and dispense medications"
      icon={QrCode}
      iconVariant="emerald"
      eyebrow="Pharmacy Dispensing"
    />
    <QRScannerPortal />
  </div>
);

export default PharmacyVerifyPage;
