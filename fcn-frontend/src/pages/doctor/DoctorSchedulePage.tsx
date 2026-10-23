import { useAuthStore } from "@/store/auth.store";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DoctorScheduleView } from "@/components/doctor-dashboard/DoctorScheduleView";

const DoctorSchedulePage = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
      <PageHeader
        title="Consultation Schedule"
        description="View, filter, and manage your weekly telehealth and in-person patient slots"
        icon={Calendar}
        iconVariant="teal"
      />

      <DoctorScheduleView doctorId={user.id} />
    </div>
  );
};

export default DoctorSchedulePage;
