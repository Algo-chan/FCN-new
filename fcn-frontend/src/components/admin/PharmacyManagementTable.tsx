import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, X, ChevronRight } from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { pharmacyService, pharmacyAdminService } from "@/services/pharmacy.service";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Pharmacy } from "@/types";

export const PharmacyManagementTable = () => {
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
