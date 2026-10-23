import { Settings } from "lucide-react";
import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";
import { PageHeader } from "@/components/ui/PageHeader";

const AdminSettingsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Platform Settings"
      description="Configure nationwide telemedicine parameters, notification gateways, and system flags"
      icon={Settings}
      iconVariant="indigo"
    />
    <SystemSettingsPanel />
  </div>
);

export default AdminSettingsPage;
