import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Clock, ClipboardList, Star, Wallet, LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const infoCards = [
  {
    icon: Wallet,
    title: "Flexible Remote Income",
    body: "Conduct consultations from your home or clinic. Set your own availability and earn per consultation.",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 dark:bg-teal-400/20",
  },
  {
    icon: ClipboardList,
    title: "Complete Patient View",
    body: "Access patient vitals, medical history, chronic conditions, and allergies in one place during every consultation.",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 dark:bg-sky-400/20",
  },
  {
    icon: Star,
    title: "Build Your Profile",
    body: "Patients rate their experience. Build a verified professional profile with real consultation history.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-400/20",
  },
];

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { playTransition, playSuccess } = useSound();
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    playTransition();
    if (clockRef.current && !shouldReduceMotion) {
      gsap.to(clockRef.current, { rotation: 360, duration: 6, ease: "none", repeat: -1 });
    }
  }, [playTransition, shouldReduceMotion]);

  // Auto-check every 60 seconds — only if we have a token
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(async () => {
      try {
        const { data: response } = await authService.getMe();
        const freshUser = response.data;
        if (freshUser && freshUser.status === "active") {
          useAuthStore.getState().setUser(freshUser);
          playSuccess();
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // ignore
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [navigate, playSuccess, accessToken]);

  const handleCheckStatus = async () => {
    if (!accessToken) {
      setStatusMsg("Please log in to check your approval status.");
      return;
    }
    setChecking(true);
    setStatusMsg(null);
    try {
      const { data: response } = await authService.getMe();
      const freshUser = response.data;
      if (!freshUser) {
        setStatusMsg("Unable to check status. Please try again.");
        return;
      }
      if (freshUser.status === "active") {
        useAuthStore.getState().setUser(freshUser);
        playSuccess();
        navigate("/dashboard", { replace: true });
      } else {
        setStatusMsg("Your application is still under review by our medical directors.");
      }
    } catch {
      setStatusMsg("Unable to check status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    authService.logout().catch(() => {});
    useAuthStore.getState().logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 py-12 transition-colors">
      <div className="w-full max-w-xl">
        {/* Top bar with Logo & Language */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/">
            <img
              src="/logo/fcn-logo-full.png"
              alt="Fast Care Now Logo"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          <LanguageSwitcher variant="pill" />
        </div>

        {/* Card Header */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/90 p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-md text-center">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
            <div ref={clockRef}>
              <Clock className="h-10 w-10" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Application Under Review</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Verification in Progress
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed mb-6">
            Welcome, <strong className="text-slate-800 dark:text-slate-200">{user?.full_name ?? "Provider"}</strong>.
            Your medical credentials and hospital license are being verified by our clinical operations team. This typically takes 24 to 48 hours.
          </p>

          {statusMsg && (
            <div className="mb-5 rounded-2xl px-4 py-3 text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 max-w-md mx-auto animate-in fade-in">
              {statusMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto mb-8">
            <Button
              variant="action"
              onClick={handleCheckStatus}
              loading={checking}
              className="flex-1 min-h-[48px]"
            >
              <RefreshCw className={checking ? "w-4 h-4 animate-spin mr-1" : "w-4 h-4 mr-1"} />
              <span>Check Status Now</span>
            </Button>
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="min-h-[48px]"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Sign Out</span>
            </Button>
          </div>

          {/* Value Props / What to expect */}
          <div className="pt-6 border-t border-slate-100 dark:border-white/10 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-center sm:text-left">
              What you can do once approved
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {infoCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] p-3.5"
                >
                  <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-2`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
