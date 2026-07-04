import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarClock, Clock, MapPin, Video, Stethoscope, User, FileText, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface BookingSummaryCardProps {
  doctorName: string;
  specialty: string;
  appointmentType: string;
  date: Date;
  time: string;
  chiefComplaint?: string;
  fee: number;
  isFreePeriod: boolean;
  isPaymentEnabled: boolean;
}

const typeIcons: Record<string, typeof Video> = {
  remote: Video,
  in_person: MapPin,
  nurse_visit: User
};

const typeLabels: Record<string, string> = {
  remote: "Video Consultation",
  in_person: "In-Person Visit",
  nurse_visit: "Nurse Home Visit"
};

export const BookingSummaryCard = ({
  doctorName,
  specialty,
  appointmentType,
  date,
  time,
  chiefComplaint,
  fee,
  isFreePeriod,
  isPaymentEnabled
}: BookingSummaryCardProps) => {
  const TypeIcon = typeIcons[appointmentType] ?? Video;
  const needsPayment = isPaymentEnabled && !isFreePeriod && fee > 0;

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
        Booking Summary
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <User className="mt-0.5 h-5 w-5 text-fcn-primary" />
          <div>
            <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              Dr. {doctorName}
            </p>
            <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              <Stethoscope className="mr-0.5 inline h-3 w-3" />
              {specialty}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TypeIcon className="mt-0.5 h-5 w-5 text-fcn-primary" />
          <div>
            <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              {typeLabels[appointmentType] ?? appointmentType}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 text-fcn-primary" />
          <div>
            <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              {format(date, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              <Clock className="mr-0.5 inline h-3 w-3" />
              {time}
            </p>
          </div>
        </div>

        {chiefComplaint && (
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-fcn-primary" />
            <div>
              <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                {chiefComplaint}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 text-fcn-primary" />
          <div>
            <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              {needsPayment ? `ETB ${fee.toFixed(2)}` : "Free"}
            </p>
            <Badge variant={needsPayment ? "warning" : "success"} size="sm">
              {needsPayment ? "Payment Required" : "No Charge"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
