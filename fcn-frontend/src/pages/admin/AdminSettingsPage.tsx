import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";

const AdminSettingsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
        Platform Settings
      </h1>
      <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
        Configure platform-wide settings and preferences
      </p>
    </div>
    <SystemSettingsPanel />
  </div>
);

export default AdminSettingsPage;
