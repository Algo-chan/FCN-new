import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Shield, ShieldCheck, Eye, EyeOff, ChevronRight, LogOut, FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { profileService } from "@/services/profile.service";
import type { User } from "@/types";

interface Props {
  user: User;
}

export const SecuritySettingsPanel = ({ user }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess, playNotification } = useSound();
  const { addToast } = useNotifications();
  const logout = useAuthStore((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpPurpose, setOtpPurpose] = useState<"enable_2fa" | "disable_2fa">("enable_2fa");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  const twoFAEnabled = (user as any).two_fa_enabled ?? false;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({ type: "danger", title: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      addToast({ type: "danger", title: "Password must be at least 8 characters" });
      return;
    }
    setChangingPw(true);
    try {
      await profileService.changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
      playSuccess();
      addToast({ type: "success", title: "Password changed", message: "You'll need to log in again on other devices." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to change password" });
    } finally {
      setChangingPw(false);
    }
  };

  const handleSendOTP = async (purpose: "enable_2fa" | "disable_2fa") => {
    setOtpPurpose(purpose);
    setSendingOtp(true);
    setOtpError(null);
    try {
      await profileService.send2FAOTP(purpose);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpModalOpen(true);
    } catch (err: any) {
      addToast({ type: "danger", title: err?.response?.data?.error?.message ?? "Failed to send OTP" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) return;
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      if (otpPurpose === "enable_2fa") {
        await profileService.enable2FA(code);
        playSuccess();
        addToast({ type: "success", title: "2FA enabled successfully", message: "Your account is now more secure." });
      } else {
        await profileService.disable2FA(code);
        playNotification();
        addToast({ type: "warning", title: "2FA disabled", message: "Your account is less secure." });
      }
      setOtpModalOpen(false);
      setDisableConfirmOpen(false);
    } catch (err: any) {
      setOtpError(err?.response?.data?.error?.message ?? "Invalid OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      const next = document.querySelector<HTMLInputElement>(`input[data-otp-idx="${index + 1}"]`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prev = document.querySelector<HTMLInputElement>(`input[data-otp-idx="${index - 1}"]`);
      prev?.focus();
    }
  };

  const passwordStrength = (pw: string): { label: string; color: string; percent: number } => {
    if (!pw) return { label: "", color: "", percent: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-fcn-danger", percent: 20 };
    if (score <= 2) return { label: "Fair", color: "bg-fcn-warning", percent: 40 };
    if (score <= 3) return { label: "Good", color: "bg-fcn-accent", percent: 60 };
    if (score <= 4) return { label: "Strong", color: "bg-fcn-success", percent: 80 };
    return { label: "Very Strong", color: "bg-fcn-success", percent: 100 };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Section 1: Change Password */}
      <Card>
        <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div className="relative">
            <Input label="Current Password" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-9 text-fcn-text-light/40 hover:text-fcn-text-light/60">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label="New Password" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-9 text-fcn-text-light/40 hover:text-fcn-text-light/60">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword && (
            <div>
              <div className="h-1.5 w-full rounded-full bg-fcn-primary/10 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${strength.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.percent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className={`mt-1 text-xs ${strength.color.replace("bg-", "text-")}`}>{strength.label}</p>
            </div>
          )}
          <div className="relative">
            <Input label="Confirm New Password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-9 text-fcn-text-light/40 hover:text-fcn-text-light/60">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={handleChangePassword} loading={changingPw}>Update Password</Button>
        </div>
      </Card>

      {/* Section 2: Two-Factor Authentication */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">Two-Factor Authentication</h3>
          <span className={`text-xs font-medium ${twoFAEnabled ? "text-fcn-success" : "text-fcn-text-light/40"}`}>
            {twoFAEnabled ? "2FA ON" : "2FA OFF"}
          </span>
        </div>

        <motion.div
          animate={{ backgroundColor: twoFAEnabled ? "rgba(16,185,129,0.05)" : "rgba(148,163,184,0.05)" }}
          className={`rounded-lg border p-5 ${twoFAEnabled ? "border-fcn-success/20" : "border-fcn-primary/10"}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={twoFAEnabled ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {twoFAEnabled ? (
                <ShieldCheck className="h-8 w-8 text-fcn-success" />
              ) : (
                <Shield className="h-8 w-8 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
              )}
            </motion.div>
            <div>
              <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                {twoFAEnabled ? "Your account is protected with 2FA" : "Add an extra layer of security"}
              </p>
              <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                {twoFAEnabled
                  ? "You'll need a code from your email to log in from new devices."
                  : "When enabled, you'll need to enter a code sent to your email each time you log in from a new device."}
              </p>
            </div>
          </div>

          {twoFAEnabled ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-fcn-success/10 px-2 py-0.5 text-xs font-medium text-fcn-success">2FA Enabled</span>
              <Button variant="ghost" size="sm" onClick={() => setDisableConfirmOpen(true)} className="text-fcn-danger hover:text-fcn-danger">
                Disable 2FA
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => handleSendOTP("enable_2fa")} loading={sendingOtp}>Enable 2FA</Button>
          )}
        </motion.div>
      </Card>

      {/* Section 3: Active Sessions */}
      <Card>
        <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-fcn-primary/5 p-3">
            <div className="h-2 w-2 rounded-full bg-fcn-success" />
            <div>
              <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Signed in on this device</p>
              <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Unknown"}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { logout(); }}>
            <LogOut className="h-4 w-4" />
            Sign Out All Other Devices
          </Button>
        </div>
      </Card>

      {/* Section 4: Download My Data */}
      <Card>
        <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark mb-4">Export Your Health Data</h3>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addToast({ type: "info", title: "Coming soon", message: "PDF export will be available in a future update." })}>
            <FileText className="h-4 w-4" />
            Vitals Report (PDF)
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addToast({ type: "info", title: "Coming soon" })}>
            <FileText className="h-4 w-4" />
            Prescriptions List
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addToast({ type: "info", title: "Coming soon" })}>
            <FileText className="h-4 w-4" />
            Appointment History
          </Button>
        </div>
        <p className="mt-3 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
          FCN retains medical records per Ethiopian healthcare regulations even after account deletion.
        </p>
      </Card>

      {/* Disable 2FA Confirmation Modal */}
      <Modal isOpen={disableConfirmOpen} onClose={() => setDisableConfirmOpen(false)} title="Disable 2FA" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-fcn-warning">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">Are you sure you want to disable 2FA?</p>
          </div>
          <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">This will make your account less secure.</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => { setDisableConfirmOpen(false); handleSendOTP("disable_2fa"); }}>Yes, Disable</Button>
            <Button variant="ghost" onClick={() => setDisableConfirmOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal isOpen={otpModalOpen} onClose={() => setOtpModalOpen(false)} title="Verify OTP" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Enter the 6-digit code sent to your email
          </p>
          {otpError && (
            <motion.p
              initial={false}
              animate={{ x: [0, -8, 8, -6, 6, 0] }}
              transition={{ duration: 0.35 }}
              className="rounded-md bg-fcn-danger/10 px-3 py-2 text-sm text-center text-fcn-danger"
            >
              {otpError}
            </motion.p>
          )}
          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                data-otp-idx={i}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-12 w-10 rounded-md border border-fcn-primary/20 bg-white text-center text-lg font-bold text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark"
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>
          <Button onClick={handleVerifyOTP} loading={verifyingOtp} className="w-full">Verify</Button>
        </div>
      </Modal>
    </div>
  );
};
