import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  BarChart3, Users, Building2, Pill, Settings, ClipboardList,
  Shield, Plus, X, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import {
  getAnalyticsOverview, getConsultationsTrend, getRegistrationsTrend,
  getTopDoctors,
} from "@/services/admin.service";
import type { UserFilters, ActivityLogFilters } from "@/services/admin.service";
import { pharmacyService, pharmacyAdminService } from "@/services/pharmacy.service";
import { AnalyticsOverviewCards } from "@/components/admin/AnalyticsOverviewCards";
import { ConsultationsTrendChart } from "@/components/admin/ConsultationsTrendChart";
import { RegistrationsTrendChart } from "@/components/admin/RegistrationsTrendChart";
import { TopDoctorsTable } from "@/components/admin/TopDoctorsTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ActivityLogsTable } from "@/components/admin/ActivityLogsTable";
import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";
import { HospitalManagementPanel } from "@/components/admin/HospitalManagementPanel";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Pharmacy } from "@/types";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
  { id: "pharmacies", label: "Pharmacies", icon: Pill },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "activity", label: "Activity Logs", icon: ClipboardList },
];

const getTabLabel = (id: string) => TABS.find((t) => t.id === id)?.label || id;

const PharmacyManagementTable = () => {
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();
  const [showCreate, setShowCreate] = useState(false);
  const [showStatus, setShowStatus] = useState<{ id: string; name: string; status: string } | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState<{ pharmacyId: string; pharmacyName: string } | null>(null);
  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createLicense, setCreateLicense] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["pharmacies", "admin"],
    queryFn: () => pharmacyService.getPharmacies(),
  });

  const pharmacies = useMemo(() => response?.data ?? [], [response]);

  const createMutation = useMutation({
    mutationFn: () => pharmacyAdminService.createPharmacy({
      name: createName,
      location: createLocation,
      license_number: createLicense,
      phone: createPhone || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      setShowCreate(false);
      setCreateName(""); setCreateLocation(""); setCreateLicense(""); setCreatePhone("");
      playSuccess();
      addToast({ type: "success", title: "Pharmacy created" });
    },
    onError: () => addToast({ type: "danger", title: "Failed to create pharmacy" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      pharmacyAdminService.updatePharmacyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      setShowStatus(null);
      playSuccess();
      addToast({ type: "success", title: "Status updated" });
    },
    onError: () => addToast({ type: "danger", title: "Failed to update status" }),
  });

  const createAdminMutation = useMutation({
    mutationFn: () => pharmacyAdminService.createPharmacyAdmin(showCreateAdmin!.pharmacyId, {
      full_name: adminName,
      email: adminEmail,
      password: adminPassword,
    }),
    onSuccess: () => {
      setGeneratedPassword(adminPassword);
      setShowCreateAdmin(null);
      playSuccess();
      addToast({ type: "success", title: "Pharmacy admin created" });
    },
    onError: () => addToast({ type: "danger", title: "Failed to create admin" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Pharmacy Management</h2>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Pharmacy</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-fcn-primary/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-fcn-primary/10 bg-fcn-primary/5">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Partner</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-fcn-primary/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-fcn-primary/10" /></td>
                  ))}
                </tr>
              ))
            ) : (
              pharmacies.map((p: Pharmacy) => (
                <tr key={p.id} className="border-b border-fcn-primary/5 hover:bg-fcn-primary/[0.02]">
                  <td className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">{p.name}</td>
                  <td className="px-4 py-3 text-fcn-text-light/70">{p.location}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "ACTIVE" ? "success" : p.status === "PENDING" ? "warning" : "danger"} size="sm">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_partner ? (
                      <Badge variant="success" size="sm">Partner</Badge>
                    ) : (
                      <span className="text-xs text-fcn-text-light/40">\u2014</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fcn-text-light/50">{p.license_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowStatus({ id: p.id, name: p.name, status: p.status })}
                        className="rounded p-1 text-fcn-text-light/50 hover:text-fcn-primary"
                        title="Change Status"
                      >
                        {p.status === "ACTIVE" ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowCreateAdmin({ pharmacyId: p.id, pharmacyName: p.name })}
                        className="rounded p-1 text-fcn-text-light/50 hover:text-fcn-primary"
                        title="Add Admin"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && pharmacies.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-fcn-text-light/40">No pharmacies found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Pharmacy">
        <div className="space-y-4">
          <Input label="Name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
          <Input label="Location" value={createLocation} onChange={(e) => setCreateLocation(e.target.value)} />
          <Input label="License Number" value={createLicense} onChange={(e) => setCreateLicense(e.target.value)} />
          <Input label="Phone" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} className="w-full">
            Create Pharmacy
          </Button>
        </div>
      </Modal>

      {showStatus && (
        <Modal isOpen={!!showStatus} onClose={() => setShowStatus(null)} title={`Change Status: ${showStatus.name}`}>
          <div className="flex flex-col gap-3">
            {["ACTIVE", "PENDING", "INACTIVE", "SUSPENDED"].map((status) => (
              <Button
                key={status}
                variant={status === showStatus.status ? "primary" : "secondary"}
                onClick={() => statusMutation.mutate({ id: showStatus.id, status })}
                loading={statusMutation.isPending}
              >
                Set as {status}
              </Button>
            ))}
          </div>
        </Modal>
      )}

      {showCreateAdmin && (
        <Modal isOpen={!!showCreateAdmin} onClose={() => setShowCreateAdmin(null)} title={`Add Admin: ${showCreateAdmin.pharmacyName}`} size="lg">
          <div className="space-y-4">
            <Input label="Full Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            <Input label="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <Input label="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            <Button onClick={() => createAdminMutation.mutate()} loading={createAdminMutation.isPending} className="w-full">
              Create Admin
            </Button>
            {generatedPassword && (
              <div className="rounded-lg border border-fcn-accent/30 bg-fcn-accent/10 p-4">
                <p className="text-sm font-medium text-fcn-accent">Admin Created! Password:</p>
                <code className="mt-1 block rounded bg-fcn-dark/10 px-2 py-1 font-mono text-sm">{generatedPassword}</code>
                <p className="mt-1 text-xs text-fcn-warning">This will not be shown again.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

const AdminPanelPage = () => {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("overview");
  const [consultationsDays, setConsultationsDays] = useState(30);
  const [userFilters, setUserFilters] = useState<UserFilters>({ page: 1, limit: 20 } as any);
  const [logFilters, setLogFilters] = useState<ActivityLogFilters>({ page: 1, limit: 50 } as any);

  const { data: overviewData } = useQuery({
    queryKey: ["admin-analytics", "overview"],
    queryFn: () => getAnalyticsOverview(),
  });

  const { data: consultationsData, isFetching: consultationsLoading } = useQuery({
    queryKey: ["admin-analytics", "consultations", consultationsDays],
    queryFn: () => getConsultationsTrend(consultationsDays),
  });

  const { data: registrationsData, isFetching: registrationsLoading } = useQuery({
    queryKey: ["admin-analytics", "registrations", 12],
    queryFn: () => getRegistrationsTrend(12),
  });

  const { data: topDoctorsData, isFetching: topDocsLoading } = useQuery({
    queryKey: ["admin-analytics", "top-doctors"],
    queryFn: () => getTopDoctors(10),
  });

  const overview = overviewData?.data;
  const consultations = consultationsData?.data ?? [];
  const registrations = registrationsData?.data ?? [];
  const topDoctors = topDoctorsData?.data ?? [];

  const handleConsultationsDaysChange = useCallback((days: number) => {
    setConsultationsDays(days);
  }, []);

  const handleUserFiltersChange = useCallback((filters: any) => {
    setUserFilters(filters);
  }, []);

  const handleLogFiltersChange = useCallback((filters: any) => {
    setLogFilters(filters);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {overview && (
              <AnalyticsOverviewCards
                overview={overview}
                onPendingClick={() => setActiveTab("users")}
                onSettingsClick={() => setActiveTab("settings")}
              />
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ConsultationsTrendChart
                  data={consultations}
                  loading={consultationsLoading}
                  onDaysChange={handleConsultationsDaysChange}
                />
              </div>
              <div className="lg:col-span-2">
                <RegistrationsTrendChart data={registrations} loading={registrationsLoading} />
              </div>
            </div>
            <TopDoctorsTable data={topDoctors} loading={topDocsLoading} />
          </div>
        );
      case "users":
        return (
          <UserManagementTable
            filters={userFilters}
            onFiltersChange={handleUserFiltersChange}
          />
        );
      case "hospitals":
        return <HospitalManagementPanel />;
      case "pharmacies":
        return <PharmacyManagementTable />;
      case "settings":
        return <SystemSettingsPanel onNavigateToTab={setActiveTab} />;
      case "activity":
        return (
          <ActivityLogsTable
            filters={logFilters}
            onFiltersChange={handleLogFiltersChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 lg:gap-6">
      <nav className="hidden lg:flex lg:w-[200px] lg:flex-col lg:gap-1 lg:border-r lg:border-fcn-primary/10 lg:pr-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "border-l-2 border-fcn-accent bg-fcn-accent/10 text-fcn-accent"
                  : "text-fcn-text-light/60 hover:bg-fcn-primary/5 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-1 flex-col overflow-hidden lg:pl-2">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo/fcn-logo-full.png" alt="FCN" className="h-7 w-auto" />
              <h1 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Admin Panel</h1>
            </div>
            <p className="text-xs text-fcn-text-light/40">Foundation Care Network Control Center</p>
          </div>
          <p className="text-xs text-fcn-text-light/40">
            Logged in as <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">{user?.full_name || "Admin"}</span>
          </p>
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-fcn-primary/5 p-1 lg:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-fcn-accent text-white"
                    : "text-fcn-text-light/60 hover:text-fcn-text-light"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
