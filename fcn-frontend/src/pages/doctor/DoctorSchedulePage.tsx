import { useAuthStore } from "@/store/auth.store";
import { Calendar } from "lucide-react";
import { DoctorScheduleView } from "@/components/doctor-dashboard/DoctorScheduleView";

const DoctorSchedulePage = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            Physician Consultation Schedule
          </h1>
          <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
            View, filter, and manage your weekly telehealth and in-person slots
          </p>
        </div>
      </div>

      <DoctorScheduleView doctorId={user.id} />
    </div>
  );
};

export default DoctorSchedulePage;
