import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Stethoscope, Users } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/landing/ImagePlaceholder";
import { HospitalMap } from "@/components/hospitals/HospitalMap";
import type { HospitalDetail, OccupancyBand } from "@/types";

interface HospitalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: HospitalDetail;
}

const bandConfig: Record<OccupancyBand, { label: string; color: string; barColor: string; bgColor: string }> = {
  low: { label: "Not Busy", color: "text-fcn-success", barColor: "bg-fcn-success", bgColor: "bg-fcn-success/10 border-fcn-success/20" },
  moderate: { label: "Moderately Busy", color: "text-fcn-warning", barColor: "bg-fcn-warning", bgColor: "bg-fcn-warning/10 border-fcn-warning/20" },
  high: { label: "Very Busy", color: "text-fcn-danger", barColor: "bg-fcn-danger", bgColor: "bg-fcn-danger/10 border-fcn-danger/20" }
};

export const HospitalDetailModal = ({ isOpen, onClose, hospital }: HospitalDetailModalProps) => {
  const navigate = useNavigate();
  const band = bandConfig[hospital.occupancy_band];
  const freePercent = 100 - hospital.occupancy_percent;

  const handleBook = () => {
    onClose();
    navigate("/appointments/book", { state: { hospitalId: hospital.id } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={hospital.name} size="xl">
      <div className="space-y-5">
        <ImagePlaceholder
          query={`${hospital.name} exterior, modern East African hospital building, daytime`}
          alt={hospital.name}
          aspectRatio="21/9"
          className="rounded-lg"
        />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                {hospital.name}
              </h3>
              {hospital.status === "active" ? (
                <Badge variant="success" size="sm">Open</Badge>
              ) : (
                <Badge variant="neutral" size="sm">{hospital.status}</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              <MapPin className="h-3.5 w-3.5" />
              {hospital.location}
            </div>
          </div>
        </div>

        <div className={clsx("rounded-lg border p-4", band.bgColor)}>
          <div className="mb-2 flex items-center justify-between">
            <span className={clsx("text-lg font-semibold", band.color)}>
              {band.label}
            </span>
            <span className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {hospital.occupancy_percent}%
            </span>
          </div>
          <div className="mb-3 h-3 overflow-hidden rounded-full bg-fcn-primary/10">
            <div
              className={clsx("h-full rounded-full", band.barColor)}
              style={{ width: `${hospital.occupancy_percent}%` }}
            />
          </div>
          <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
            {hospital.recommendation}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-fcn-primary/5 p-3 text-center">
            <Stethoscope className="mx-auto h-5 w-5 text-fcn-primary" />
            <p className="mt-1 text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {hospital.active_doctors_count}
            </p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Doctors</p>
          </div>
          <div className="rounded-lg bg-fcn-primary/5 p-3 text-center">
            <Clock className="mx-auto h-5 w-5 text-fcn-primary" />
            <p className="mt-1 text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              ~{hospital.avg_wait_minutes}
            </p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Min Wait</p>
          </div>
          <div className="rounded-lg bg-fcn-primary/5 p-3 text-center">
            <Users className="mx-auto h-5 w-5 text-fcn-primary" />
            <p className="mt-1 text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {hospital.total_beds}
            </p>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Total Beds</p>
          </div>
          <div className="rounded-lg bg-fcn-primary/5 p-3 text-center">
            <span className="mx-auto flex h-5 w-5 items-center justify-center text-lg font-bold text-fcn-primary">
              {freePercent}%
            </span>
            <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Free</p>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            Specialties
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {hospital.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full bg-fcn-primary/10 px-3 py-1 text-sm text-fcn-primary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {hospital.lat && hospital.lng && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Location
            </h4>
            <HospitalMap hospitals={[hospital]} single height={200} />
          </div>
        )}

        <Button onClick={handleBook} size="lg" className="w-full">
          Book at This Hospital
        </Button>
      </div>
    </Modal>
  );
};
