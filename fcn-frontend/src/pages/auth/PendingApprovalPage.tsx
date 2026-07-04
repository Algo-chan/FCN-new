import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Clock, ClipboardList, Star, Wallet, LogOut, RefreshCw } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const infoCards = [
  { icon: Wallet, title: "Flexible Remote Income", body: "Conduct consultations from your home or clinic. Set your own availability and earn per consultation." },
  { icon: ClipboardList, title: "Complete Patient View", body: "Access patient vitals, medical history, chronic conditions, and allergies in one place during every consultation." },
  { icon: Star, title: "Build Your Profile", body: "Patients rate their experience. Build a verified professional profile with real consultation history." }
];

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { playTransition, playSuccess } = useSound();
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playTransition();
    if (clockRef.current && !shouldReduceMotion) {
      gsap.to(clockRef.current, { rotation: 360, duration: 4, ease: "none", repeat: -1 });
    }
  }, [playTransition, shouldReduceMotion]);

  // Auto-check every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: response } = await authService.getMe();
        const user = response.data;
        if (user && user.status === "active") {
          useAuthStore.getState().setUser(user);
          playSuccess();
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // ignore
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [navigate, playSuccess]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMsg(null);
    try {
      const { data: response } = await authService.getMe();
      const user = response.data;
      if (!user) {
        setStatusMsg("Unable to check status. Please try again.");
        return;
      }
      if (user.status === "active") {
        useAuthStore.getState().setUser(user);
        playSuccess();
        navigate("/dashboard", { replace: true });
      } else {
        setStatusMsg("Your application is still under review.");
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-fcn-dark to-[#0A1628] px-6 py-12">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/logo/fcn-logo-full.png"
          alt="FCN Logo"
          className="h-10 w-auto"
        />
      </div>

      {/* Top Section */}
      <div className="mb-12 text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div ref={clockRef} className="absolute inset-0 rounded-full border-2 border-fcn-accent/30" />
          <Clock className="h-10 w-10 text-fcn-accent" />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">Your Application is Under Review</h1>
        <p className="mb-4 text-sm text-white/50">Our team will verify your credentials within 24–48 hours</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-fcn-warning/20 px-4 py-1.5 text-sm font-medium text-fcn-warning">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Pending Review
        </span>
      </div>

      {/* Info Cards */}
      <div className="mb-12 grid max-w-2xl gap-4 sm:grid-cols-3">
        {infoCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={!shouldReduceMotion ? { opacity: 0, y: 30 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.3 + i * 0.15, duration: shouldReduceMotion ? 0 : 0.4 }}
            className="rounded-lg border border-white/10 bg-white/5 p-5"
          >
            <card.icon className="mb-3 h-8 w-8 text-fcn-accent" />
            <h3 className="mb-1.5 text-sm font-semibold text-white">{card.title}</h3>
            <p className="text-xs leading-relaxed text-white/50">{card.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="text-center">
        {statusMsg && (
          <p className="mb-3 rounded-md bg-white/5 px-4 py-2 text-sm text-white/70">{statusMsg}</p>
        )}

        <div className="flex items-center justify-center gap-4">
          <Button onClick={handleCheckStatus} loading={checking}>
            {checking ? "Checking..." : "Check Status"}
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-4 w-4" /> Logout
          </Button>
        </div>

        <p className="mt-6 text-sm text-white/40">
          Have questions?{" "}
          <a href="mailto:support@foundationcarenetwork.com" className="text-fcn-accent hover:underline">support@foundationcarenetwork.com</a>
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalPage;