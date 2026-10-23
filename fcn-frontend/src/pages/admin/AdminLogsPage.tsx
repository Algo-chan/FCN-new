import { useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { ActivityLogsTable } from "@/components/admin/ActivityLogsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ActivityLogFilters } from "@/services/admin.service";

const AdminLogsPage = () => {
  const [logFilters, setLogFilters] = useState<ActivityLogFilters>({ page: 1, limit: 50 } as any);

  const handleLogFiltersChange = useCallback((filters: any) => {
    setLogFilters(filters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs & Audit Trail"
        description="Monitor system events, clinical actions, authentication records, and administrative modifications in real-time"
        icon={ClipboardList}
        iconVariant="indigo"
      />
      <ActivityLogsTable
        filters={logFilters}
        onFiltersChange={handleLogFiltersChange}
      />
    </div>
  );
};

export default AdminLogsPage;
