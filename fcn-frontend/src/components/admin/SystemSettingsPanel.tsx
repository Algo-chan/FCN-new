import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { getSettings, updateSetting, manualCleanup, clearAllNotifications } from "@/services/admin.service";
import { useSound } from "@/hooks/useSound";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

const ToggleSwitch = ({ checked, onChange, disabled, label }: ToggleSwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fcn-accent focus:ring-offset-2 ${
      checked ? "bg-fcn-accent" : "bg-gray-300 dark:bg-gray-600"
    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
  >
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-block h-5 w-5 rounded-full bg-white shadow-md ${
        checked ? "translate-x-[22px]" : "translate-x-0.5"
      }`}
    />
    <span className="sr-only">{label}</span>
  </button>
);

interface SettingRowProps {
  label: string;
  description?: string;
  type: "toggle" | "text" | "number" | "datetime";
  value: string;
  onChange: (value: string) => void;
  saving?: boolean;
  danger?: boolean;
  warning?: string;
  confirmRequired?: boolean;
  confirmText?: string;
  onConfirm?: () => void;
}

const SettingRow = ({
  label, description, type, value, onChange, saving, danger, warning, confirmRequired, confirmText, onConfirm,
}: SettingRowProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const handleChange = useCallback((newValue: string) => {
    if (confirmRequired) {
      setShowConfirm(true);
      return;
    }
    onChange(newValue);
  }, [confirmRequired, onChange]);

  const handleConfirm = useCallback(() => {
    if (confirmInput !== confirmText) return;
    setShowConfirm(false);
    setConfirmInput("");
    onConfirm?.();
  }, [confirmInput, confirmText, onConfirm]);

  const handleToggle = useCallback((checked: boolean) => {
    const newValue = String(checked);
    if (confirmRequired) {
      setShowConfirm(true);
      return;
    }
    onChange(newValue);
  }, [confirmRequired, onChange, confirmText]);

  return (
    <div className={`flex items-start justify-between gap-4 rounded-lg p-4 ${danger ? "border border-fcn-danger/20 bg-fcn-danger/5" : "bg-fcn-primary/5"}`}>
      <div className="flex-1">
        <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{label}</p>
        {description && <p className="mt-0.5 text-xs text-fcn-text-light/50">{description}</p>}
        {warning && <p className="mt-1 text-xs text-fcn-warning">{warning}</p>}
      </div>
      <div className="flex items-center gap-3">
        {type === "toggle" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-fcn-text-light/40">{value === "true" ? "ON" : "OFF"}</span>
            <ToggleSwitch
              checked={value === "true"}
              onChange={handleToggle}
              disabled={saving}
              label={label}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              disabled={saving}
              className="w-24 rounded-md border border-fcn-primary/10 bg-white/50 px-2.5 py-1.5 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
            />
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-fcn-accent border-t-transparent" />
            )}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fcn-dark/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-fcn-primary/20 bg-white p-6 shadow-xl dark:bg-fcn-dark">
            <h3 className="mb-2 text-lg font-semibold text-fcn-warning flex items-center gap-2">
              <span className="text-xl">⚠️</span> Confirm Change
            </h3>
            <p className="mb-4 text-sm text-fcn-text-light/60">
              {warning || "This is a dangerous setting. Please type the confirmation text below to proceed."}
            </p>
            <p className="mb-2 text-xs font-medium text-fcn-text-light/60">
              Type <code className="rounded bg-fcn-dark/10 px-1.5 py-0.5 font-mono text-sm">{confirmText}</code> to confirm
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={confirmText}
              className="mb-4 w-full rounded-lg border border-fcn-primary/10 bg-white/50 p-2.5 text-sm text-fcn-text-light outline-none focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => { setShowConfirm(false); setConfirmInput(""); }}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={confirmInput !== confirmText}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  onNavigateToTab?: (tab: string) => void;
}

export const SystemSettingsPanel = ({ onNavigateToTab }: Props) => {
  const queryClient = useQueryClient();
  const { playSuccess, playTransition } = useSound();

  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettings(),
  });

  const settings = response?.data ?? [];

  const getSetting = (key: string): string => {
    return settings.find((s: any) => s.key === key)?.value ?? "";
  };

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      playTransition();
      toast.success("Saved \u2713", { duration: 2000, position: "bottom-right" });
    },
    onError: () => toast.error("Failed to save", { duration: 2000 }),
  });

  const cleanupMutation = useMutation({
    mutationFn: () => manualCleanup(),
    onSuccess: (data) => {
      playSuccess();
      toast.success(`Cleaned up ${data?.data?.deleted_count || 0} messages`);
    },
    onError: () => toast.error("Cleanup failed"),
  });

  const clearNotifMutation = useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: (data) => {
      playSuccess();
      toast.success(`Cleared ${data?.data?.deleted_count || 0} notifications`);
    },
    onError: () => toast.error("Clear failed"),
  });

  const [cleanupConfirm, setCleanupConfirm] = useState("");
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [clearNotifInput, setClearNotifInput] = useState("");
  const [showClearNotifConfirm, setShowClearNotifConfirm] = useState(false);

  const handlePaymentEnable = useCallback(() => {
    updateMutation.mutate({ key: "payment_enabled", value: "true" });
  }, [updateMutation]);

  const handleSmsEnable = useCallback(() => {
    updateMutation.mutate({ key: "sms_enabled", value: "true" });
  }, [updateMutation]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-fcn-primary/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Payment Settings
        </h3>
        <div className="space-y-3">
          <SettingRow
            label="Payment Enabled"
            description="Toggle platform payments ON/OFF. Currently OFF = free pilot."
            type="toggle"
            value={getSetting("payment_enabled")}
            onChange={() => {}}
            confirmRequired
            confirmText="ENABLE"
            warning="⚠️ Enabling payments will charge patients Br50 per consultation. Make sure Chapa is fully configured. Are you sure?"
            onConfirm={handlePaymentEnable}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="Platform Fee (ETB)"
            description="Fee charged per consultation"
            type="number"
            value={getSetting("platform_fee_etb") || "50"}
            onChange={(v) => updateMutation.mutate({ key: "platform_fee_etb", value: v })}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="Doctor Cut (%)"
            description="Percentage of fee that goes to doctors"
            type="number"
            value={getSetting("doctor_cut_percent") || "80"}
            onChange={(v) => updateMutation.mutate({ key: "doctor_cut_percent", value: v })}
            saving={updateMutation.isPending}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Communication
        </h3>
        <div className="space-y-3">
          <SettingRow
            label="SMS Enabled"
            description="Enable SMS notifications via Twilio"
            type="toggle"
            value={getSetting("sms_enabled")}
            onChange={() => {}}
            confirmRequired
            confirmText="ENABLE"
            warning="SMS costs money per message. Ensure Twilio is configured."
            onConfirm={handleSmsEnable}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="FCM Enabled"
            description="Enable push notifications via Firebase"
            type="toggle"
            value={getSetting("fcm_enabled") || "true"}
            onChange={(v) => updateMutation.mutate({ key: "fcm_enabled", value: v })}
            saving={updateMutation.isPending}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          AI Settings
        </h3>
        <div className="space-y-3">
          <SettingRow
            label="AI Triage Enabled"
            description="Enable AI-powered symptom triage"
            type="toggle"
            value={getSetting("ai_triage_enabled") || "true"}
            onChange={(v) => updateMutation.mutate({ key: "ai_triage_enabled", value: v })}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="AI Max Rounds"
            description="Maximum conversation rounds (1-5)"
            type="number"
            value={getSetting("ai_max_rounds") || "3"}
            onChange={(v) => updateMutation.mutate({ key: "ai_max_rounds", value: v })}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="AI Model"
            description="Claude model identifier"
            type="text"
            value={getSetting("ai_model") || "claude-sonnet-4-20250514"}
            onChange={(v) => updateMutation.mutate({ key: "ai_model", value: v })}
            saving={updateMutation.isPending}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Data Retention
        </h3>
        <div className="space-y-3">
          <SettingRow
            label="Message Retention (days)"
            description="Messages older than this many days are automatically deleted"
            type="number"
            value={getSetting("message_retention_days") || "90"}
            onChange={(v) => updateMutation.mutate({ key: "message_retention_days", value: v })}
            saving={updateMutation.isPending}
            warning="Decreasing this will delete more messages"
          />
          <SettingRow
            label="Notification Retention (days)"
            type="number"
            value={getSetting("notification_retention_days") || "30"}
            onChange={(v) => updateMutation.mutate({ key: "notification_retention_days", value: v })}
            saving={updateMutation.isPending}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Appointments
        </h3>
        <div className="space-y-3">
          <SettingRow
            label="Cancellation Cutoff (hours)"
            description="Hours before appointment when cancellation is allowed"
            type="number"
            value={getSetting("cancellation_cutoff_hours") || "2"}
            onChange={(v) => updateMutation.mutate({ key: "cancellation_cutoff_hours", value: v })}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="Max Reschedule Count"
            type="number"
            value={getSetting("max_reschedule_count") || "2"}
            onChange={(v) => updateMutation.mutate({ key: "max_reschedule_count", value: v })}
            saving={updateMutation.isPending}
          />
          <SettingRow
            label="Medication Reminders"
            type="toggle"
            value={getSetting("medication_reminders_enabled") || "true"}
            onChange={(v) => updateMutation.mutate({ key: "medication_reminders_enabled", value: v })}
            saving={updateMutation.isPending}
          />
        </div>
      </Card>

      <div className="rounded-lg border border-fcn-danger/30 bg-fcn-danger/5 p-6">
        <h3 className="mb-4 text-lg font-bold text-fcn-danger">Danger Zone</h3>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              Manual Message Cleanup
            </p>
            <p className="mb-2 text-xs text-fcn-text-light/50">
              Triggers cleanup job that deletes messages older than retention period.
            </p>
            {!showCleanupConfirm ? (
              <Button variant="danger" size="sm" onClick={() => setShowCleanupConfirm(true)}>
                Run Cleanup
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={cleanupConfirm}
                  onChange={(e) => setCleanupConfirm(e.target.value)}
                  placeholder='Type "CLEANUP" to confirm'
                  className="flex-1 rounded-lg border border-fcn-danger/30 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-danger dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={cleanupConfirm !== "CLEANUP"}
                  loading={cleanupMutation.isPending}
                  onClick={() => {
                    cleanupMutation.mutate();
                    setShowCleanupConfirm(false);
                    setCleanupConfirm("");
                  }}
                >
                  Confirm Cleanup
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowCleanupConfirm(false); setCleanupConfirm(""); }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              Clear All Notifications
            </p>
            <p className="mb-2 text-xs text-fcn-text-light/50">
              Clears read notifications for all users.
            </p>
            {!showClearNotifConfirm ? (
              <Button variant="danger" size="sm" onClick={() => setShowClearNotifConfirm(true)}>
                Clear Notifications
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={clearNotifInput}
                  onChange={(e) => setClearNotifInput(e.target.value)}
                  placeholder='Type "CONFIRM" to confirm'
                  className="flex-1 rounded-lg border border-fcn-danger/30 bg-white/50 px-3 py-2 text-sm text-fcn-text-light outline-none focus:border-fcn-danger dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={clearNotifInput !== "CONFIRM"}
                  loading={clearNotifMutation.isPending}
                  onClick={() => {
                    clearNotifMutation.mutate();
                    setShowClearNotifConfirm(false);
                    setClearNotifInput("");
                  }}
                >
                  Confirm Clear
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowClearNotifConfirm(false); setClearNotifInput(""); }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
