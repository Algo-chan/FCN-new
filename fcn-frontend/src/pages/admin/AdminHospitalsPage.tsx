import { Building2 } from "lucide-react";
import { HospitalManagementPanel } from "@/components/admin/HospitalManagementPanel";
import { PageHeader } from "@/components/ui/PageHeader";

const AdminHospitalsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Hospital Management"
      description="Register, verify, and monitor Ethiopian hospitals and facility administrators"
      icon={Building2}
      iconVariant="indigo"
      eyebrow="Healthcare Infrastructure"
    />
    <HospitalManagementPanel />
  </div>
);

export default AdminHospitalsPage;
