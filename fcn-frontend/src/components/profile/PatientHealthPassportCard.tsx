import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { HeartPulse, Pencil, User, X, Save, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { profileService, type UpdatePatientProfileDto } from "@/services/profile.service";
import type { PatientProfile } from "@/types";

interface Props {
  profile: PatientProfile;
  onEdit?: () => void;
}

const bloodTypeColors: Record<string, string> = {
  "O+": "bg-fcn-success/10 text-fcn-success border-fcn-success/20",
  "O-": "bg-fcn-success/10 text-fcn-success border-fcn-success/20",
  "A+": "bg-fcn-primary/10 text-fcn-primary border-fcn-primary/20",
  "A-": "bg-fcn-primary/10 text-fcn-primary border-fcn-primary/20",
  "B+": "bg-fcn-warning/10 text-fcn-warning border-fcn-warning/20",
  "B-": "bg-fcn-warning/10 text-fcn-warning border-fcn-warning/20",
  "AB+": "bg-fcn-danger/10 text-fcn-danger border-fcn-danger/20",
  "AB-": "bg-amber-100 text-amber-700 border-amber-200"
};

const computeAge = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const computeBMI = (weight: number | null | undefined, height: number | null | undefined): string => {
  if (!weight || !height) return "—";
  const hMeters = height / 100;
  const bmi = weight / (hMeters * hMeters);
  return bmi.toFixed(1);
};

export const PatientHealthPassportCard = ({ profile, onEdit }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdatePatientProfileDto>({});
  const [saving, setSaving] = useState(false);

  const heartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heartRef.current) {
      gsap.to(heartRef.current, {
        scale: 1.15,
        duration: 0.3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        repeatDelay: 1.2
      });
    }
  }, []);

  const handleEdit = () => {
    setFormData({
      date_of_birth: profile.date_of_birth ?? undefined,
      blood_type: profile.blood_type ?? undefined,
      weight_kg: profile.weight_kg ? Number(profile.weight_kg) : undefined,
      height_cm: profile.height_cm ? Number(profile.height_cm) : undefined,
      chronic_conditions: profile.chronic_conditions,
      known_allergies: profile.known_allergies ?? undefined,
      home_address: profile.home_address ?? undefined,
      emergency_contact_name: profile.emergency_contact_name ?? undefined,
      emergency_contact_phone: profile.emergency_contact_phone ?? undefined
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updatePatientProfile(formData);
      playSuccess();
      addToast({ type: "success", title: "Health passport updated" });
      setIsEditing(false);
      onEdit?.();
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const age = profile.date_of_birth ? computeAge(profile.date_of_birth) : null;
  const bmi = computeBMI(profile.weight_kg, profile.height_cm);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div ref={heartRef} className="inline-flex">
            <HeartPulse className="h-5 w-5 text-fcn-accent" />
          </div>
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Smart Health Passport</h3>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Date of Birth" type="date" value={formData.date_of_birth?.split("T")[0] ?? ""} onChange={(e) => setFormData((f) => ({ ...f, date_of_birth: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Blood Type</label>
                <select value={formData.blood_type ?? ""} onChange={(e) => setFormData((f) => ({ ...f, blood_type: e.target.value || undefined }))} className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark">
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <Input label="Weight (kg)" type="number" value={formData.weight_kg ?? ""} onChange={(e) => setFormData((f) => ({ ...f, weight_kg: e.target.value ? Number(e.target.value) : undefined }))} />
              <Input label="Height (cm)" type="number" value={formData.height_cm ?? ""} onChange={(e) => setFormData((f) => ({ ...f, height_cm: e.target.value ? Number(e.target.value) : undefined }))} />
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Chronic Conditions (comma-separated)</label>
                <input
                  type="text"
                  value={formData.chronic_conditions?.join(", ") ?? ""}
                  onChange={(e) => setFormData((f) => ({ ...f, chronic_conditions: e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : [] }))}
                  placeholder="e.g. Hypertension, Diabetes"
                  className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white px-3 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark"
                />
              </div>
              <div className="md:col-span-2">
                <Input label="Known Allergies" value={formData.known_allergies ?? ""} onChange={(e) => setFormData((f) => ({ ...f, known_allergies: e.target.value || undefined }))} placeholder="e.g. Penicillin, Peanuts" />
              </div>
              <div className="md:col-span-2">
                <Input label="Home Address" value={formData.home_address ?? ""} onChange={(e) => setFormData((f) => ({ ...f, home_address: e.target.value || undefined }))} />
              </div>
              <Input label="Emergency Contact Name" value={formData.emergency_contact_name ?? ""} onChange={(e) => setFormData((f) => ({ ...f, emergency_contact_name: e.target.value || undefined }))} />
              <Input label="Emergency Contact Phone" value={formData.emergency_contact_phone ?? ""} onChange={(e) => setFormData((f) => ({ ...f, emergency_contact_phone: e.target.value || undefined }))} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <HealthCard label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "—"} sub={age !== null ? `${age} years` : undefined} />
              <div>
                <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Blood Type</span>
                {profile.blood_type ? (
                  <div className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${bloodTypeColors[profile.blood_type] ?? "bg-gray-100 text-gray-700"}`}>{profile.blood_type}</div>
                ) : (
                  <p className="mt-1 text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40">—</p>
                )}
              </div>
              <HealthCard label="Weight" value={profile.weight_kg ? `${profile.weight_kg} kg` : "—"} />
              <HealthCard label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : "—"} />
              <HealthCard label="BMI" value={bmi !== "—" ? bmi : "—"} />
              <div>
                <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Chronic Conditions</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.chronic_conditions?.length ? profile.chronic_conditions.map((c, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-fcn-primary/10 px-2 py-0.5 text-xs font-medium text-fcn-primary">{c}</span>
                  )) : <span className="text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40">None</span>}
                </div>
              </div>
              <div>
                <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Known Allergies</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.known_allergies ? (
                    <span className="inline-flex items-center rounded-full bg-fcn-danger/10 px-2 py-0.5 text-xs font-medium text-fcn-danger">{profile.known_allergies}</span>
                  ) : (
                    <span className="text-sm text-fcn-text-light/40 dark:text-fcn-text-dark/40">None</span>
                  )}
                </div>
              </div>
            </div>

            {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
              <div className="rounded-lg bg-fcn-warning/5 border border-fcn-warning/10 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-fcn-warning" />
                  <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">
                    {profile.emergency_contact_name ?? "Emergency Contact"}
                  </span>
                  {profile.emergency_contact_phone && (
                    <span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">{profile.emergency_contact_phone}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">For emergencies only</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const HealthCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div>
    <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{label}</span>
    <p className="mt-1 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">{value}</p>
    {sub && <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">{sub}</p>}
  </div>
);
