import { useState, useCallback } from "react";
import { ActivityLogsTable } from "@/components/admin/ActivityLogsTable";
import type { ActivityLogFilters } from "@/services/admin.service";

const AdminLogsPage = () => {
  const [logFilters, setLogFilters] = useState<ActivityLogFilters>({ page: 1, limit: 50 } as any);

  const handleLogFiltersChange = useCallback((filters: any) => {
    setLogFilters(filters);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Activity Logs
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          View all platform activity and audit trails
        </p>
      </div>
      <ActivityLogsTable
        filters={logFilters}
        onFiltersChange={handleLogFiltersChange}
      />
    </div>
  );
};

export default AdminLogsPage;
