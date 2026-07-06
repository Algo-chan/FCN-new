import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft, ChevronRight, Search, Eye, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getActivityLogs } from "@/services/admin.service";
import type { ActivityLogFilters } from "@/services/admin.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StaggerChildren } from "@/components/animations/StaggerChildren";

const ACTION_VARIANTS: Record<string, "success" | "danger" | "info" | "warning" | "neutral"> = {
  APPROVE_DOCTOR: "success",
  APPROVE_NURSE: "success",
  REJECT_DOCTOR: "danger",
  REJECT_NURSE: "danger",
  SUSPEND_USER: "danger",
  REACTIVATE_USER: "success",
  CREATE_HOSPITAL_ADMIN: "info",
  CREATE_PHARMACY_ADMIN: "info",
  CREATE_HOSPITAL: "info",
  UPDATE_HOSPITAL: "info",
  ACTIVATE_HOSPITAL: "success",
  DEACTIVATE_HOSPITAL: "warning",
  CREATE_PHARMACY: "info",
  ACTIVATE_PHARMACY: "success",
  DEACTIVATE_PHARMACY: "warning",
  UPDATE_SETTING: "warning",
  ENABLE_PAYMENT: "success",
  DISABLE_PAYMENT: "warning",
  ENABLE_SMS: "success",
  SEND_TEST_NOTIF: "neutral",
  MANUAL_CLEANUP: "neutral",
};

interface Props {
  filters: ActivityLogFilters;
  onFiltersChange: (filters: ActivityLogFilters) => void;
}

export const ActivityLogsTable = ({ filters, onFiltersChange }: Props) => {
  const [viewingDetails, setViewingDetails] = useState<any>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: () => getActivityLogs(filters),
  });

  const logs = useMemo(() => response?.data ?? [], [response]);
  const meta = response?.meta ?? { total: 0, page: 1, limit: 50 };

  const totalPages = Math.ceil(meta.total / meta.limit);

  const handleExportCSV = useCallback(() => {
    const headers = ["Time", "Actor", "Actor Role", "Action", "Target Type", "Target Name", "IP Address"];
    const rows = logs.map((log: any) => [
      new Date(log.created_at).toISOString(),
      log.actor?.full_name || log.actor_id,
      log.actor_role,
      log.action,
      log.target_type || "",
      log.target_name || "",
      log.ip_address || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r: string[]) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const handlePageChange = useCallback((page: number) => {
    onFiltersChange({ ...filters, page });
  }, [filters, onFiltersChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.action || ""}
            onChange={(e) => onFiltersChange({ ...filters, action: e.target.value || undefined, page: 1 })}
            className="rounded-lg border border-fcn-primary/10 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
          >
            <option value="">All Actions</option>
            <option value="APPROVE_DOCTOR">Approve Doctor</option>
            <option value="REJECT_DOCTOR">Reject Doctor</option>
            <option value="APPROVE_NURSE">Approve Nurse</option>
            <option value="REJECT_NURSE">Reject Nurse</option>
            <option value="SUSPEND_USER">Suspend User</option>
            <option value="REACTIVATE_USER">Reactivate User</option>
            <option value="UPDATE_SETTING">Update Setting</option>
          </select>
          <input
            type="date"
            value={filters.fromDate || ""}
            onChange={(e) => onFiltersChange({ ...filters, fromDate: e.target.value || undefined, page: 1 })}
            className="rounded-lg border border-fcn-primary/10 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
          />
          <input
            type="date"
            value={filters.toDate || ""}
            onChange={(e) => onFiltersChange({ ...filters, toDate: e.target.value || undefined, page: 1 })}
            className="rounded-lg border border-fcn-primary/10 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
          />
        </div>
        <Button size="sm" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-fcn-primary/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-fcn-primary/10 bg-fcn-primary/5">
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Time</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Actor</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Action</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Target</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Details</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-fcn-primary/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-fcn-primary/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-fcn-primary/5 transition-colors hover:bg-fcn-primary/[0.02]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-fcn-text-light dark:text-fcn-text-dark">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-fcn-text-light/40">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.actor?.full_name || "?"} size="sm" role={log.actor_role || "super_admin"} />
                        <div>
                          <p className="text-xs font-medium">{log.actor?.full_name || "Unknown"}</p>
                          <Badge variant="neutral" size="sm">{log.actor_role}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ACTION_VARIANTS[log.action] || "neutral"} size="sm">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-fcn-text-light/70">
                      {log.target_type}: {log.target_name || log.target_id || "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {log.details ? (
                        <button
                          onClick={() => setViewingDetails(log.details)}
                          className="flex items-center gap-1 text-xs text-fcn-primary hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-fcn-text-light/30">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-fcn-text-light/50">
                      {log.ip_address || "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-fcn-text-light/40">
                  No activity logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-fcn-text-light/50">
          Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="rounded p-1 text-fcn-text-light/50 hover:text-fcn-primary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-fcn-text-light/60">Page {meta.page} of {totalPages || 1}</span>
          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page >= totalPages}
            className="rounded p-1 text-fcn-text-light/50 hover:text-fcn-primary disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fcn-dark/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-fcn-primary/20 bg-white p-5 shadow-xl dark:bg-fcn-dark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Details</h3>
              <button onClick={() => setViewingDetails(null)} className="text-fcn-text-light/50 hover:text-fcn-text-light">
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-lg bg-fcn-dark/5 p-3 text-xs font-mono text-fcn-text-light/70 dark:bg-fcn-light/5">
              {JSON.stringify(viewingDetails, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
