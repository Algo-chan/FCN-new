import { useAuthStore } from "@/store/auth.store";
import { DoctorScheduleView } from "@/components/doctor-dashboard/DoctorScheduleView";

const DoctorSchedulePage = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">My Schedule</h1>
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">View and manage your weekly appointments</p>
      </div>
      <DoctorScheduleView doctorId={user.id} />
    </div>
  );
};

export default DoctorSchedulePage;
