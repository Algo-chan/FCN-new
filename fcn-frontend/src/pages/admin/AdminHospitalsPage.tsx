import { HospitalManagementPanel } from "@/components/admin/HospitalManagementPanel";

const AdminHospitalsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
        Admin - Hospital Management
      </h1>
      <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
        Manage all hospitals and hospital administrators
      </p>
    </div>
    <HospitalManagementPanel />
  </div>
);

export default AdminHospitalsPage;
