import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";
import { CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, UserX, ThumbsUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getUserReview, approveUser, rejectUser } from "@/services/admin.service";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";

interface Props {
  userId: string;
  onDecision: () => void;
  onClose: () => void;
}

export const UserReviewModal = ({ userId, onDecision, onClose }: Props) => {
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [copied, setCopied] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["user-review", userId],
    queryFn: () => getUserReview(userId),
    enabled: !!userId,
  });

  const review = response?.data;

  const approveMutation = useMutation({
    mutationFn: () => approveUser(userId),
    onSuccess: () => {
      playSuccess();
      addToast({ type: "success", title: "User approved successfully!" });
      onDecision();
      triggerConfetti();
    },
    onError: () => addToast({ type: "danger", title: "Failed to approve user" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectUser(userId, rejectReason),
    onSuccess: () => {
      addToast({ type: "success", title: "User rejected" });
      onDecision();
    },
    onError: () => addToast({ type: "danger", title: "Failed to reject user" }),
  });

  const triggerConfetti = useCallback(() => {
    if (!confettiRef.current) return;
    const colors = ["#10B981", "#2DD4BF", "#34D399", "#6EE7B7"];
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
        position: absolute;
        width: ${6 + Math.random() * 6}px;
        height: ${6 + Math.random() * 6}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        pointer-events: none;
      `;
      confettiRef.current.appendChild(particle);
      gsap.to(particle, {
        y: -100 - Math.random() * 200,
        x: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 720,
        opacity: 0,
        duration: 1 + Math.random(),
        ease: "power2.out",
        onComplete: () => particle.remove(),
      });
    }
  }, []);

  const handleCopyLicense = useCallback((license: string) => {
    navigator.clipboard.writeText(license);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading..." size="xl">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-fcn-accent border-t-transparent" />
        </div>
      </Modal>
    );
  }

  if (!review) return null;

  const { user, profile, hospital, flags } = review;
  const isDoctor = user.role === "doctor";
  const isNurse = user.role === "nurse";

  return (
    <Modal isOpen={true} onClose={onClose} title="Review User" size="xl">
      <div className="relative" ref={confettiRef}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar name={user.full_name} size="lg" role={user.role} />
              <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">{user.full_name}</h3>
              <Badge variant={user.role === "doctor" ? "success" : "warning"} size="sm">
                {user.role.replace(/_/g, " ")}
              </Badge>
              <p className="mt-1 text-xs text-fcn-text-light/40">
                Registered {formatDistanceToNow(new Date(review.registration_date), { addSuffix: true })}
              </p>
            </div>

            <div className="rounded-lg bg-fcn-primary/5 p-4 space-y-3">
              <div>
                <p className="text-xs text-fcn-text-light/40">Email</p>
                <p className="text-sm font-medium">{user.email || "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs text-fcn-text-light/40">Phone</p>
                <p className="text-sm font-medium">{user.phone || "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs text-fcn-text-light/40">Status</p>
                <Badge variant={user.status === "pending" ? "warning" : "success"} size="sm">
                  {user.status}
                  {user.status === "pending" && " since " + formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </Badge>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            {isDoctor && profile && (
              <>
                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    License Information
                  </h4>
                  <div className="flex items-center justify-between rounded-md bg-fcn-dark/5 px-3 py-2 font-mono text-sm dark:bg-fcn-light/5">
                    <span>{profile.license_number}</span>
                    <button onClick={() => handleCopyLicense(profile.license_number)} className="text-fcn-primary hover:text-fcn-accent">
                      {copied ? <CheckCircle className="h-4 w-4 text-fcn-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {review.license_verification_status === "valid" ? (
                      <><CheckCircle className="h-4 w-4 text-fcn-success" /> Valid format</>
                    ) : (
                      <><XCircle className="h-4 w-4 text-fcn-danger" /> Invalid format (expected: XX0000)</>
                    )}
                  </div>
                  <a
                    href="https://example.com/medical-board"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-fcn-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Verify this license at Ethiopian Medical Board
                  </a>
                </div>

                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Specialty
                  </h4>
                  <p className="text-sm font-medium">{profile.specialty}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {review.specialty_valid ? (
                      <><CheckCircle className="h-4 w-4 text-fcn-success" /> Valid specialty</>
                    ) : (
                      <><XCircle className="h-4 w-4 text-fcn-danger" /> Unknown specialty \u2014 verify manually</>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Hospital Affiliation
                  </h4>
                  {hospital ? (
                    <p className="text-sm font-medium">{hospital.name}</p>
                  ) : (
                    <p className="text-sm text-fcn-warning">No hospital affiliated</p>
                  )}
                </div>

                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Experience
                  </h4>
                  <p className="text-sm font-medium">{profile.years_experience} years</p>
                </div>

                {profile.bio && (
                  <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                      Professional Bio
                    </h4>
                    <div className="max-h-24 overflow-y-auto text-sm text-fcn-text-light/70">
                      {profile.bio}
                    </div>
                  </div>
                )}
              </>
            )}

            {isNurse && profile && (
              <>
                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Nursing License
                  </h4>
                  <div className="flex items-center justify-between rounded-md bg-fcn-dark/5 px-3 py-2 font-mono text-sm dark:bg-fcn-light/5">
                    <span>{profile.license_number}</span>
                    <button onClick={() => handleCopyLicense(profile.license_number)} className="text-fcn-primary hover:text-fcn-accent">
                      {copied ? <CheckCircle className="h-4 w-4 text-fcn-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {review.license_verification_status === "valid" ? (
                      <><CheckCircle className="h-4 w-4 text-fcn-success" /> Valid format</>
                    ) : (
                      <><XCircle className="h-4 w-4 text-fcn-danger" /> Invalid format</>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Coverage Zone
                  </h4>
                  <p className="text-sm font-medium">{profile.coverage_zone}</p>
                </div>
                <div className="rounded-lg border border-fcn-primary/10 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Experience
                  </h4>
                  <p className="text-sm font-medium">{profile.years_experience || 0} years</p>
                </div>
              </>
            )}

            {flags && flags.length > 0 ? (
              <div className="rounded-lg border border-fcn-danger/30 bg-fcn-danger/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-fcn-danger" />
                  <h4 className="text-sm font-semibold text-fcn-danger">Review Required</h4>
                </div>
                <div className="space-y-1.5">
                  {flags.map((flag: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                    >
                      <div className="flex items-start gap-2 text-xs text-fcn-danger/80 dark:text-fcn-danger/80">
                        <span>{flag.includes("No") ? "\u26A0\uFE0F" : "\u274C"}</span>
                        <span>{flag}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-fcn-success/30 bg-fcn-success/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-fcn-success" />
                  <p className="text-sm font-medium text-fcn-success">No automatic issues detected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-fcn-primary/10 pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {!showRejectForm && !showApproveConfirm && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3"
                >
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<UserX className="h-4 w-4" />}
                    onClick={() => setShowRejectForm(true)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ThumbsUp className="h-4 w-4" />}
                    onClick={() => setShowApproveConfirm(true)}
                  >
                    Approve
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showRejectForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-3 overflow-hidden"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-fcn-danger">
                      Rejection reason (required)
                    </label>
                    <textarea
                      placeholder="Explain why this application is being rejected..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-lg border border-fcn-danger/30 bg-white/50 p-2 text-sm text-fcn-text-light outline-none focus:border-fcn-danger dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
                      rows={3}
                    />
                    {rejectReason.length > 0 && rejectReason.length < 20 && (
                      <p className="mt-1 text-xs text-fcn-danger">Minimum 20 characters required</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setShowRejectForm(false); setRejectReason(""); }}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle className="h-4 w-4" />}
                      disabled={rejectReason.trim().length < 20}
                      loading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate()}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showApproveConfirm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-3 overflow-hidden"
                >
                  <div className="rounded-lg bg-fcn-success/10 p-3">
                    <p className="text-sm font-medium text-fcn-success">
                      Approve {user.full_name} as FCN {user.role.replace(/_/g, " ")}?
                    </p>
                    <p className="mt-1 text-xs text-fcn-text-light/60">
                      They will be notified and can immediately start using the platform.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowApproveConfirm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle className="h-4 w-4" />}
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                    >
                      Confirm Approval
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Modal>
  );
};
