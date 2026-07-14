import { useState, useCallback } from "react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import type { UserFilters } from "@/services/admin.service";

const AdminUsersPage = () => {
  const [userFilters, setUserFilters] = useState<UserFilters>({ page: 1, limit: 20 } as any);

  const handleUserFiltersChange = useCallback((filters: any) => {
    setUserFilters(filters);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          User Management
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Manage all platform users and their roles
        </p>
      </div>
      <UserManagementTable
        filters={userFilters}
        onFiltersChange={handleUserFiltersChange}
      />
    </div>
  );
};

export default AdminUsersPage;
