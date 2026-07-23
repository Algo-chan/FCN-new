import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/doctors/PhotoUpload";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { profileService, type UpdateDoctorProfileDto, type UpdateDoctorVisibilityDto } from "@/services/profile.service";
import type { DoctorProfile, User } from "@/types";

interface Props {
  user: User;
  profile: DoctorProfile;
  hospital?: { name: string; location: string } | null;
}

const LANGUAGES = ["Amharic", "English", "Somali", "Oromo", "Tigrinya", "Arabic"] as const;
const CONSULTATION_TYPES = ["remote", "in_person", "nurse_visit"] as const;

export const DoctorProfileEditor = ({ user, profile, hospital }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const [formData, setFormData] = useState<UpdateDoctorProfileDto>({
    bio: profile.bio ?? "",
    years_experience: profile.years_experience,
    consultation_fee_etb: Number(profile.consultation_fee_etb),
    languages_spoken: (profile as any).languages_spoken ?? [],
    clinic_address: (profile as any).clinic_address ?? "",
    consultation_types: (profile as any).consultation_types ?? []
  });

  const [visibility, setVisibility] = useState<UpdateDoctorVisibilityDto>({
    show_phone: (profile as any).show_phone ?? false,
    show_email: (profile as any).show_email ?? false,
    show_hospital: (profile as any).show_hospital ?? true,
    show_rating: (profile as any).show_rating ?? true,
    show_experience: (profile as any).show_experience ?? true,
    show_consultation_count: (profile as any).show_consultation_count ?? true
  });

  const [saving, setSaving] = useState(false);
  const [savingVis, setSavingVis] = useState(false);

  const previewDoctor: any = {
    id: user.id,
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    role: user.role,
    status: user.status,
    doctor_profile: {
      specialty: profile.specialty,
      hospital_id: profile.hospital_id,
      hospital_name: hospital?.name ?? null,
      availability_status: profile.availability_status,
      bio: formData.bio ?? profile.bio,
      rating_average: Number(profile.rating_average),
      rating_count: profile.rating_count,
      years_experience: formData.years_experience ?? profile.years_experience,
      consultation_fee_etb: formData.consultation_fee_etb ?? Number(profile.consultation_fee_etb),
      photo_url: profile.photo_url
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updateDoctorProfile(formData);
      playSuccess();
      addToast({ type: "success", title: "Profile updated" });
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = async (key: keyof UpdateDoctorVisibilityDto, value: boolean) => {
    const updated = { ...visibility, [key]: value };
    setVisibility(updated);
    setSavingVis(true);
    try {
      await profileService.updateDoctorVisibility(updated);
      addToast({ type: "success", title: `Visibility updated` });
    } catch {
      setVisibility(visibility);
    } finally {
      setSavingVis(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    const current = formData.languages_spoken ?? [];
    const updated = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang];
    setFormData((f) => ({ ...f, languages_spoken: updated }));
  };

  const toggleConsultationType = (type: "remote" | "in_person" | "nurse_visit") => {
    const current = formData.consultation_types ?? [];
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    setFormData((f) => ({ ...f, consultation_types: updated }));
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Professional Info */}
      <Card>
        <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-4">Professional Information</h3>
        <div className="space-y-4">
          <div className="flex justify-center">
            <PhotoUpload currentPhotoUrl={profile.photo_url} doctorId={user.id} />
          </div>

          <Input label="Full Name" value={user.full_name ?? ""} disabled />
          <Input label="Specialty" value={profile.specialty} disabled />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Bio</label>
            <textarea
              value={formData.bio ?? ""}
              onChange={(e) => setFormData((f) => ({ ...f, bio: e.target.value }))}
              maxLength={1000}
              rows={4}
              className="h-24 w-full rounded-md border border-fcn-primary/20 bg-white px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark resize-none"
            />
            <p className="mt-1 text-right text-xs text-fcn-text-light/40">{formData.bio?.length ?? 0}/1000</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Years of Experience" type="number" min={0} max={60} value={formData.years_experience ?? ""} onChange={(e) => setFormData((f) => ({ ...f, years_experience: e.target.value ? Number(e.target.value) : undefined }))} />
            <Input label="Consultation Fee (ETB)" type="number" min={0} value={formData.consultation_fee_etb ?? ""} onChange={(e) => setFormData((f) => ({ ...f, consultation_fee_etb: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Languages Spoken</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
                    formData.languages_spoken?.includes(lang)
                      ? "bg-fcn-primary text-white border-fcn-primary"
                      : "bg-transparent text-fcn-text-light/60 dark:text-fcn-text-dark/60 border-fcn-primary/20 hover:border-fcn-primary/40"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Consultation Types Accepted</label>
            <div className="flex flex-wrap gap-2">
              {CONSULTATION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleConsultationType(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
                    formData.consultation_types?.includes(type)
                      ? "bg-fcn-accent text-white border-fcn-accent"
                      : "bg-transparent text-fcn-text-light/60 dark:text-fcn-text-dark/60 border-fcn-primary/20 hover:border-fcn-accent/40"
                  }`}
                >
                  {type === "remote" ? "Remote" : type === "in_person" ? "In-Person" : "Nurse Visit"}
                </button>
              ))}
            </div>
          </div>

          <Input label="Clinic Address (optional)" value={formData.clinic_address ?? ""} onChange={(e) => setFormData((f) => ({ ...f, clinic_address: e.target.value }))} />

          <Button onClick={handleSave} loading={saving} className="w-full md:w-auto">Save Professional Info</Button>
        </div>
      </Card>

      {/* Section 2: Live Preview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Public Profile Preview</h3>
          <span className="rounded-full bg-fcn-primary/10 px-2 py-0.5 text-xs font-medium text-fcn-primary">Preview</span>
        </div>
        <p className="mb-4 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">This is how patients see you on Find Doctors</p>
        <div className="max-w-xs mx-auto">
          <motion.div
            key={JSON.stringify(formData)}
            initial={shouldReduceMotion ? false : { opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DoctorCard doctor={previewDoctor} index={0} onClick={() => {}} />
          </motion.div>
        </div>
      </Card>

      {/* Section 3: Visibility Controls */}
      <Card>
        <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-4">Control What Patients Can See</h3>
        <div className="space-y-4">
          {([
            { key: "show_hospital", label: "Hospital" },
            { key: "show_rating", label: "Rating & Reviews" },
            { key: "show_experience", label: "Years of Experience" },
            { key: "show_consultation_count", label: "Consultation Count" },
            { key: "show_phone", label: "Phone Number" },
            { key: "show_email", label: "Email Address" }
          ] as const).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{label}</span>
                <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                  {visibility[key as keyof UpdateDoctorVisibilityDto] ? "Visible to patients" : "Hidden from patients"}
                </p>
              </div>
              <button
                onClick={() => handleVisibilityChange(key as keyof UpdateDoctorVisibilityDto, !visibility[key as keyof UpdateDoctorVisibilityDto])}
                disabled={savingVis}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  visibility[key as keyof UpdateDoctorVisibilityDto] ? "bg-fcn-accent" : "bg-fcn-primary/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    visibility[key as keyof UpdateDoctorVisibilityDto] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
