import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, HeartPulse, Stethoscope, Eye, Shield, AlertTriangle, Save, Phone, Mail, Calendar } from "lucide-react";
import { profileService, type FullProfile } from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import { PatientHealthPassportCard } from "@/components/profile/PatientHealthPassportCard";
import { DoctorProfileEditor } from "@/components/profile/DoctorProfileEditor";
import { SecuritySettingsPanel } from "@/components/profile/SecuritySettingsPanel";
import { AccountDeletionFlow } from "@/components/profile/AccountDeletionFlow";
import type { Role } from "@/types";

type TabConfig = {
  id: string;
  label: string;
  icon: typeof User;
  roles: Role[];
};

const ALL_TABS: TabConfig[] = [
  { id: "profile", label: "Profile", icon: User, roles: ["patient", "doctor", "nurse", "rural_health_officer", "hospital_admin", "pharmacy_admin", "super_admin"] },
  { id: "passport", label: "Health Passport", icon: HeartPulse, roles: ["patient"] },
  { id: "professional", label: "Professional", icon: Stethoscope, roles: ["doctor"] },
  { id: "public", label: "Public Profile", icon: Eye, roles: ["doctor"] },
  { id: "security", label: "Security", icon: Shield, roles: ["patient", "doctor", "nurse", "rural_health_officer", "hospital_admin", "pharmacy_admin", "super_admin"] },
  { id: "account", label: "Account", icon: AlertTriangle, roles: ["patient", "doctor", "nurse", "rural_health_officer"] }
];

const ProfilePage = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeletion, setShowDeletion] = useState(false);

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measureTabs = useCallback(() => {
    const active = tabRefs.current.get(activeTab);
    const container = active?.parentElement;
    if (!active || !container) return;
    const cr = active.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    setIndicator({ left: cr.left - pr.left, width: cr.width });
  }, [activeTab]);

  useLayoutEffect(() => {
    measureTabs();
    window.addEventListener("resize", measureTabs);
    return () => window.removeEventListener("resize", measureTabs);
  }, [measureTabs]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => profileService.getMyProfile(),
    enabled: !!user
  });

  const profileData = data?.data as FullProfile | undefined;
  const myProfile = profileData?.profile;
  const hospital = profileData?.hospital;

  useEffect(() => {
    if (profileData?.user && user) {
      setUser(profileData.user as any);
    }
  }, [profileData]);

  useEffect(() => {
    if (profileData?.user && !isEditing) {
      setEditName(profileData.user.full_name ?? "");
      setEditEmail(profileData.user.email ?? "");
      setEditPhone(profileData.user.phone ?? "");
    }
  }, [profileData, isEditing]);

  if (!user) return null;

  const availableTabs = ALL_TABS.filter((t) => t.roles.includes(user.role));
  const currentTab = availableTabs.find((t) => t.id === activeTab) ?? availableTabs[0];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await profileService.updateProfile({
        full_name: editName !== user.full_name ? editName : undefined,
        email: editEmail !== user.email ? editEmail : undefined,
        phone: editPhone !== user.phone ? editPhone : undefined
      });
      if (res.data) setUser(res.data as any);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      playSuccess();
      addToast({ type: "success", title: "Profile updated" });
      setIsEditing(false);
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeVariant: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
    patient: "success",
    doctor: "info",
    nurse: "warning",
    rural_health_officer: "neutral",
    hospital_admin: "danger",
    pharmacy_admin: "success",
    super_admin: "danger"
  };

  const roleLabels: Record<string, string> = {
    patient: "Patient",
    doctor: "Doctor",
    nurse: "Nurse",
    rural_health_officer: "Rural Health Officer",
    hospital_admin: "Hospital Admin",
    pharmacy_admin: "Pharmacy Admin",
    super_admin: "Super Admin"
  };

  const statusLabel = user.status === "active" ? "Active" : user.status === "pending" ? "Pending" : user.status === "suspended" ? "Suspended" : "Rejected";
  const statusVariant = user.status === "active" ? "success" : user.status === "pending" ? "warning" : "danger";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Tab Navigation */}
      <div className="relative flex gap-1 md:gap-4 rounded-lg bg-fcn-primary/5 p-1 w-full overflow-x-auto hide-scrollbar">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el); else tabRefs.current.delete(tab.id); }}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1 md:gap-2 rounded-md px-2 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors shrink-0 ${
              activeTab === tab.id ? "text-white" : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60 dark:hover:text-fcn-text-dark"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        <motion.div
          layoutId="profile-tab-indicator"
          className="absolute inset-y-1 rounded-md bg-fcn-primary"
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-4 md:space-y-6">
              {/* Identity Card */}
              <Card>
                <div className="flex flex-col items-center text-center">
                  <InitialsAvatar name={profileData?.user?.full_name ?? user.full_name} size="xl" role={user.role} />
                  <h2 className="mt-4 text-xl md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">{profileData?.user?.full_name ?? user.full_name}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={roleBadgeVariant[user.role] ?? "neutral"}>{roleLabels[user.role] ?? user.role}</Badge>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    {profileData?.user?.email && (
                      <div className="flex items-center gap-2 justify-center"><Mail className="h-4 w-4" /><span className="truncate max-w-[200px]">{profileData.user.email}</span></div>
                    )}
                    {profileData?.user?.phone && (
                      <div className="flex items-center gap-2 justify-center"><Phone className="h-4 w-4" /><span>{profileData.user.phone}</span></div>
                    )}
                    {profileData?.user?.created_at && (
                      <div className="flex items-center gap-2 justify-center"><Calendar className="h-4 w-4" /><span>Member since {new Date(profileData.user.created_at).toLocaleDateString()}</span></div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Edit Profile Form */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Edit Profile</h3>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <div>
                      <Input label="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                      {editEmail !== profileData?.user?.email && (
                        <p className="mt-1 text-xs text-fcn-warning">OTP will be sent to verify new email</p>
                      )}
                    </div>
                    <div>
                      <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+251 9XX XXX XXX" />
                      <p className="mt-1 text-xs text-fcn-text-light/40">Ethiopian +251 format</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} loading={saving}>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Full Name</span>
                        <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{profileData?.user?.full_name ?? user.full_name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Email</span>
                        <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">{profileData?.user?.email ?? "—"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Phone</span>
                        <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{profileData?.user?.phone ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : activeTab === "passport" && myProfile && "user_id" in myProfile ? (
            <PatientHealthPassportCard
              profile={myProfile as any}
              onEdit={() => queryClient.invalidateQueries({ queryKey: ["my-profile"] })}
            />
          ) : activeTab === "professional" && myProfile && "specialty" in myProfile ? (
            <DoctorProfileEditor user={profileData?.user ?? user} profile={myProfile as any} hospital={hospital} />
          ) : activeTab === "public" && myProfile && "specialty" in myProfile ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Your Public Profile</h3>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/doctors/${user.id}`, "_blank")}>
                  View live →
                </Button>
              </div>
              <div className="rounded-lg border border-fcn-primary/10 overflow-hidden max-w-md mx-auto">
                <iframe
                  src={`/doctors/${user.id}`}
                  className="w-full h-[400px] md:h-[600px]"
                  title="Public Profile Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </Card>
          ) : activeTab === "security" ? (
            <SecuritySettingsPanel user={profileData?.user ?? user} />
          ) : activeTab === "account" ? (
            <Card className="border-fcn-danger/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-fcn-danger" />
                <h3 className="text-base md:text-lg font-bold text-fcn-danger">Danger Zone</h3>
              </div>
              <p className="mb-4 text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger" onClick={() => setShowDeletion(true)}>
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </Button>
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Account Deletion Flow */}
      <AnimatePresence>
        {showDeletion && (
          <AccountDeletionFlow
            fullName={profileData?.user?.full_name ?? user.full_name}
            onCancel={() => setShowDeletion(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
