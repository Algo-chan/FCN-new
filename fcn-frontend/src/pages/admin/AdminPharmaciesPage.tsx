import { PharmacyManagementTable } from "@/components/admin/PharmacyManagementTable";

const AdminPharmaciesPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
        Pharmacy Management
      </h1>
      <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
        Manage all pharmacies and pharmacy administrators
      </p>
    </div>
    <PharmacyManagementTable />
  </div>
);

export default AdminPharmaciesPage;
