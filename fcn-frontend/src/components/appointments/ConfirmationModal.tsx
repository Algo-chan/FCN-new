import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "created" | "cancelled" | "rescheduled";
  checkoutUrl?: string | null;
}

const typeConfig = {
  created: {
    title: "Appointment Created",
    message: "Your appointment has been successfully created. You will receive a confirmation shortly.",
    variant: "success" as const
  },
  cancelled: {
    title: "Appointment Cancelled",
    message: "Your appointment has been cancelled.",
    variant: "danger" as const
  },
  rescheduled: {
    title: "Appointment Rescheduled",
    message: "Your appointment has been rescheduled.",
    variant: "info" as const
  }
};

export const ConfirmationModal = ({ isOpen, onClose, type }: ConfirmationModalProps) => {
  const config = typeConfig[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title} size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-fcn-success/10 p-3">
          <CheckCircle className="h-8 w-8 text-fcn-success" />
        </div>
        <p className="text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
          {config.message}
        </p>

        {/* Payment section - commented out for now, will be configured later
        {checkoutUrl && (
          <div className="w-full space-y-3">
            <div className="rounded-lg border border-fcn-warning/20 bg-fcn-warning/5 p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-fcn-warning" />
                <p className="text-xs font-medium text-fcn-warning">Payment Required</p>
              </div>
              <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Please complete payment to confirm your appointment.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => window.open(checkoutUrl, "_blank")}
              icon={<ExternalLink className="h-4 w-4" />}
            >
              Pay Now
            </Button>
          </div>
        )}
        */}

        <Button variant="secondary" onClick={onClose}>
          OK
        </Button>
      </div>
    </Modal>
  );
};
