import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { getUsers, approveUser, rejectUser, suspendUser, reactivateUser } from "@/services/admin.service";
import type { UserFilters } from "@/services/admin.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserReviewModal } from "./UserReviewModal";
import { clsx } from "clsx";
import type { User } from "@/types";

const ROLE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "rural_health_officer", label: "Rural H.O." },
  { value: "hospital_admin", label: "Hospital Admin" },
  { value: "pharmacy_admin", label: "Pharmacy Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
];

const roleBadgeVariant: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  patient: "info",
  doctor: "success",
  nurse: "warning",
  rural_health_officer: "neutral",
  hospital_admin: "warning",
  pharmacy_admin: "success",
  super_admin: "danger",
};

const statusBadgeVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  rejected: "neutral",
};

interface Props {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export const UserManagementTable = ({ filters, onFiltersChange }: Props) => {
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();
  const [search, setSearch] = useState(filters.search || "");
  const debouncedSearch = useDebounce(search, 400);
  const [reviewUserId, setReviewUserId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const effectiveFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
  }), [filters, debouncedSearch]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-users", effectiveFilters],
    queryFn: () => getUsers(effectiveFilters),
  });

  const users = useMemo(() => response?.data ?? [], [response]);
  const meta = response?.meta ?? { total: 0, page: 1, limit: 20 };

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      playSuccess();
      addToast({ type: "success", title: "User approved" });
    },
    onError: () => addToast({ type: "danger", title: "Failed to approve user" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => rejectUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      addToast({ type: "success", title: "User rejected" });
    },
    onError: () => addToast({ type: "danger", title: "Failed to reject user" }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSuspendUserId(null);
      setSuspendReason("");
      addToast({ type: "success", title: "User suspended" });
    },
    onError: (err: any) => addToast({ type: "danger", title: err?.response?.data?.error?.message || "Failed to suspend user" }),
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      addToast({ type: "success", title: "User reactivated" });
    },
    onError: () => addToast({ type: "danger", title: "Failed to reactivate user" }),
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleRoleFilter = useCallback((role: string) => {
    onFiltersChange({ ...filters, role, page: 1 });
  }, [filters, onFiltersChange]);

  const handleStatusFilter = useCallback((status: string) => {
    onFiltersChange({ ...filters, status, page: 1 });
  }, [filters, onFiltersChange]);

  const handlePageChange = useCallback((page: number) => {
    onFiltersChange({ ...filters, page });
  }, [filters, onFiltersChange]);

  const totalPages = Math.ceil(meta.total / meta.limit);
  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/40" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-fcn-primary/10 bg-white/50 py-2 pl-9 pr-3 text-sm text-fcn-text-light outline-none transition-colors placeholder:text-fcn-text-light/30 focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
          />
        </div>
        <select
          value={filters.role || "all"}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="rounded-lg border border-fcn-primary/10 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filters.status || "all"}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="rounded-lg border border-fcn-primary/10 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-fcn-primary/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-fcn-primary/10 bg-fcn-primary/5">
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">User</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Role</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Status</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Registered</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-fcn-primary/5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-fcn-primary/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="border-b border-fcn-primary/5 transition-colors hover:bg-fcn-primary/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name} size="sm" role={user.role} />
                      <div>
                        <p className="font-medium text-fcn-text-light dark:text-fcn-text-dark">{user.full_name}</p>
                        <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant[user.role] || "neutral"} size="sm">
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[user.status] || "neutral"} size="sm">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(user.status === "pending" && (user.role === "doctor" || user.role === "nurse")) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setReviewUserId(user.id)}
                        >
                          Review
                        </Button>
                      )}
                      {user.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSuspendUserId(user.id)}
                          className="text-fcn-danger hover:text-fcn-danger"
                        >
                          Suspend
                        </Button>
                      )}
                      {user.status === "suspended" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reactivateMutation.mutate(user.id)}
                          loading={reactivateMutation.isPending}
                          className="text-fcn-success hover:text-fcn-success"
                        >
                          Reactivate
                        </Button>
                      )}
                      {user.status === "rejected" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewUserId(user.id)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-fcn-text-light/40">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-fcn-text-light/50">
          Showing {startItem}-{endItem} of {meta.total} users
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

      {suspendUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fcn-dark/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-fcn-primary/20 bg-white p-5 shadow-xl dark:bg-fcn-dark">
            <h3 className="mb-4 text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Suspend User
            </h3>
            <p className="mb-3 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              This will prevent the user from accessing the platform.
            </p>
            <textarea
              placeholder="Reason for suspension (required)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="mb-4 w-full rounded-lg border border-fcn-primary/10 bg-white/50 p-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => { setSuspendUserId(null); setSuspendReason(""); }}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={suspendReason.trim().length < 5}
                loading={suspendMutation.isPending}
                onClick={() => suspendMutation.mutate({ userId: suspendUserId, reason: suspendReason })}
              >
                Confirm Suspend
              </Button>
            </div>
          </div>
        </div>
      )}

      {reviewUserId && (
        <UserReviewModal
          userId={reviewUserId}
          onDecision={() => {
            setReviewUserId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
          }}
          onClose={() => setReviewUserId(null)}
        />
      )}
    </div>
  );
};
