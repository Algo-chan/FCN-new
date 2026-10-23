import { Pill } from "lucide-react";
import { PharmacyManagementTable } from "@/components/admin/PharmacyManagementTable";
import { PageHeader } from "@/components/ui/PageHeader";

const AdminPharmaciesPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Pharmacy Management"
      description="Manage licensed pharmacies, track medication dispensing, and review pharmacy administrators"
      icon={Pill}
      iconVariant="indigo"
    />
    <PharmacyManagementTable />
  </div>
);

export default AdminPharmaciesPage;
