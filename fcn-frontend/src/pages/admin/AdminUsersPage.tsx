import { useState, useCallback } from "react";
import { Users } from "lucide-react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { PageHeader } from "@/components/ui/PageHeader";
import type { UserFilters } from "@/services/admin.service";

const AdminUsersPage = () => {
  const [userFilters, setUserFilters] = useState<UserFilters>({ page: 1, limit: 20 } as any);

  const handleUserFiltersChange = useCallback((filters: any) => {
    setUserFilters(filters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Oversee and manage patient, doctor, nurse, and admin accounts across Fast Care Now"
        icon={Users}
        iconVariant="indigo"
      />
      <UserManagementTable
        filters={userFilters}
        onFiltersChange={handleUserFiltersChange}
      />
    </div>
  );
};

export default AdminUsersPage;
