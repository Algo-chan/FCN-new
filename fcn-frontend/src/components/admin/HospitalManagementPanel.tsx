import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Building2, Copy, Eye, Plus, Shield, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { hospitalsService } from "@/services/hospitals.service";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { MASTER_SPECIALTIES } from "@/constants/specialties";
import { clsx } from "clsx";
import type { Hospital, HospitalAdminProfile } from "@/types";

const CreateHospitalSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  location: z.string().trim().min(3, "Location must be at least 3 characters"),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  specialties: z.array(z.string()).min(1, "Select at least one specialty")
});

const CreateAdminSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Valid email required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/\d/, "Must contain at least one number")
});

type CreateHospitalForm = z.infer<typeof CreateHospitalSchema>;
type CreateAdminForm = z.infer<typeof CreateAdminSchema>;

const generatePassword = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 14; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!/[A-Z]/.test(password)) {
    password = "A" + password.slice(1);
  }
  if (!/\d/.test(password)) {
    password = password.slice(0, -1) + "7";
  }
  return password;
};

export const HospitalManagementPanel = () => {
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<{ hospital: Hospital } | null>(null);
  const [showAdminsModal, setShowAdminsModal] = useState<{ hospital: Hospital } | null>(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["hospitals", "all"],
    queryFn: () => hospitalsService.getAllHospitals("all")
  });

  const hospitals = useMemo(() => response?.data ?? [], [response]);

  const { data: adminsResponse } = useQuery({
    queryKey: ["hospital-admins", showAdminsModal?.hospital.id],
    queryFn: () => hospitalsService.getHospitalAdmins(showAdminsModal!.hospital.id),
    enabled: !!showAdminsModal
  });

  const admins = useMemo(() => adminsResponse?.data ?? [], [adminsResponse]);

  const createHospitalForm = useForm<CreateHospitalForm>({
    resolver: zodResolver(CreateHospitalSchema),
    defaultValues: { name: "", location: "", lat: undefined, lng: undefined, specialties: [] }
  });

  const createAdminForm = useForm<CreateAdminForm>({
    resolver: zodResolver(CreateAdminSchema),
    defaultValues: { full_name: "", email: "", password: generatePassword() }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateHospitalForm) => hospitalsService.createHospital({
      name: data.name,
      location: data.location,
      lat: data.lat || undefined,
      lng: data.lng || undefined,
      specialties: data.specialties
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      setShowCreateModal(false);
      createHospitalForm.reset();
      playSuccess();
      addToast({ type: "success", title: "Hospital created" });
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to create hospital" });
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      hospitalsService.updateHospitalStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      setShowStatusModal(null);
      playSuccess();
      addToast({ type: "success", title: "Status updated" });
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: ({ hospitalId, data }: { hospitalId: string; data: CreateAdminForm }) =>
      hospitalsService.createHospitalAdmin(hospitalId, { ...data, hospital_id: hospitalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-admins"] });
      setGeneratedPassword(createAdminForm.getValues("password"));
      setShowCreateAdminModal(false);
      playSuccess();
      addToast({ type: "success", title: "Hospital admin created" });
    }
  });

  const handleCreateHospital = useCallback((data: CreateHospitalForm) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleCreateAdmin = useCallback((data: CreateAdminForm) => {
    if (!showAdminsModal) {
      return;
    }
    createAdminMutation.mutate({ hospitalId: showAdminsModal.hospital.id, data });
  }, [createAdminMutation, showAdminsModal]);

  const handleCopyPassword = useCallback(() => {
    navigator.clipboard.writeText(generatedPassword);
    addToast({ type: "success", title: "Password copied to clipboard" });
  }, [generatedPassword, addToast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Hospital Management
        </h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Add New Hospital
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-fcn-primary/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-fcn-primary/10 bg-fcn-primary/5">
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Name</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Location</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Status</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Occupancy</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Last Updated</th>
              <th className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id} className="border-b border-fcn-primary/5 hover:bg-fcn-primary/[0.02]">
                <td className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">
                  {h.name}
                </td>
                <td className="px-4 py-3 text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                  {h.location}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={h.status === "active" ? "success" : h.status === "pending" ? "warning" : "danger"}
                    size="sm"
                  >
                    {h.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-fcn-text-light dark:text-fcn-text-dark">
                  {h.occupancy_percent}%
                </td>
                <td className="px-4 py-3 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  {formatDistanceToNow(new Date(h.last_updated_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowStatusModal({ hospital: h })}
                      className="rounded p-1 text-fcn-text-light/50 hover:text-fcn-primary"
                      title="Change Status"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowAdminsModal({ hospital: h })}
                      className="rounded p-1 text-fcn-text-light/50 hover:text-fcn-primary"
                      title="Manage Admins"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-fcn-text-light/50">
                  No hospitals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Hospital">
        <form onSubmit={createHospitalForm.handleSubmit(handleCreateHospital)} className="space-y-4">
          <Input label="Hospital Name" error={createHospitalForm.formState.errors.name?.message} {...createHospitalForm.register("name")} />
          <Input label="Location" error={createHospitalForm.formState.errors.location?.message} {...createHospitalForm.register("location")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude" type="number" step="any" {...createHospitalForm.register("lat")} />
            <Input label="Longitude" type="number" step="any" {...createHospitalForm.register("lng")} />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Specialties</span>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-fcn-primary/10 p-3">
              {MASTER_SPECIALTIES.map((spec) => {
                const selected = createHospitalForm.watch("specialties")?.includes(spec) ?? false;
                return (
                  <label key={spec} className={clsx("flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors", selected ? "bg-fcn-accent/10 text-fcn-accent" : "text-fcn-text-light/60 hover:bg-fcn-primary/5 dark:text-fcn-text-dark/60")}>
                    <input
                      type="checkbox"
                      value={spec}
                      checked={selected}
                      onChange={(e) => {
                        const current = createHospitalForm.getValues("specialties") ?? [];
                        if (e.target.checked) {
                          createHospitalForm.setValue("specialties", [...current, spec], { shouldValidate: true });
                        } else {
                          createHospitalForm.setValue("specialties", current.filter((s) => s !== spec), { shouldValidate: true });
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-fcn-primary/30 text-fcn-accent focus:ring-fcn-accent"
                    />
                    {spec}
                  </label>
                );
              })}
            </div>
            {createHospitalForm.formState.errors.specialties?.message && (
              <p className="mt-1 text-sm text-fcn-danger">{createHospitalForm.formState.errors.specialties.message}</p>
            )}
          </div>
          <Button type="submit" loading={createMutation.isPending} className="w-full">Create Hospital</Button>
        </form>
      </Modal>

      {showStatusModal && (
        <Modal
          isOpen={!!showStatusModal}
          onClose={() => setShowStatusModal(null)}
          title={`Change Status: ${showStatusModal.hospital.name}`}
        >
          <div className="flex flex-col gap-3">
            {["active", "pending", "inactive"].map((status) => (
              <Button
                key={status}
                variant={status === showStatusModal.hospital.status ? "primary" : "secondary"}
                onClick={() => statusMutation.mutate({ id: showStatusModal.hospital.id, status })}
                loading={statusMutation.isPending}
              >
                Set as {status}
              </Button>
            ))}
          </div>
        </Modal>
      )}

      {showAdminsModal && (
        <Modal
          isOpen={!!showAdminsModal}
          onClose={() => { setShowAdminsModal(null); setShowCreateAdminModal(false); }}
          title={`Admins: ${showAdminsModal.hospital.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                Current Admins
              </h3>
              <Button size="sm" onClick={() => {
                const pw = generatePassword();
                createAdminForm.setValue("password", pw);
                setShowCreateAdminModal(true);
                setGeneratedPassword("");
              }}>
                <Plus className="h-4 w-4" />
                Add Admin
              </Button>
            </div>

            {admins.length === 0 ? (
              <p className="py-4 text-center text-sm text-fcn-text-light/50">No admins for this hospital</p>
            ) : (
              <div className="divide-y divide-fcn-primary/10">
                {admins.map((a) => (
                  <div key={a.user_id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                        {a.full_name}
                      </p>
                      <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                        {a.email}
                      </p>
                    </div>
                    <Badge variant={a.status === "active" ? "success" : "neutral"} size="sm">
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {showCreateAdminModal && (
              <div className="border-t border-fcn-primary/10 pt-4">
                <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  Create Hospital Admin
                </h3>
                <form onSubmit={createAdminForm.handleSubmit(handleCreateAdmin)} className="space-y-3">
                  <Input label="Full Name" error={createAdminForm.formState.errors.full_name?.message} {...createAdminForm.register("full_name")} />
                  <Input label="Email" error={createAdminForm.formState.errors.email?.message} {...createAdminForm.register("email")} />
                  <Input label="Password" type="text" error={createAdminForm.formState.errors.password?.message} {...createAdminForm.register("password")} />
                  <Button type="submit" loading={createAdminMutation.isPending} className="w-full" size="sm">
                    Create Admin Account
                  </Button>
                </form>
              </div>
            )}

            {generatedPassword && (
              <div className="rounded-lg border border-fcn-accent/30 bg-fcn-accent/10 p-4">
                <p className="text-sm font-medium text-fcn-accent">Admin Created Successfully</p>
                <p className="mt-1 text-xs text-fcn-text-light/70">Temporary password (shown once):</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 rounded bg-fcn-dark/10 px-2 py-1 text-sm font-mono">
                    {generatedPassword}
                  </code>
                  <button onClick={handleCopyPassword} className="rounded p-1 hover:bg-fcn-primary/10" title="Copy password">
                    <Copy className="h-4 w-4 text-fcn-primary" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-fcn-warning">
                  This password will not be shown again. Share it securely with the admin.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
