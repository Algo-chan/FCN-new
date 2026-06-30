import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Eye, EyeOff, Heart, Loader2, Lock, Mail, Stethoscope, Syringe, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { useSound } from "@/hooks/useSound";
import { ForgotPasswordModal } from "@/pages/auth/ForgotPasswordModal";
import { Button } from "@/components/ui/Button";

const VITE_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

const featurePills = [
  { icon: Stethoscope, text: "Remote Consultations" },
  { icon: Heart, text: "AI Symptom Check" },
  { icon: Syringe, text: "E-Prescriptions" }
];

const avatarColors = ["#0A7EA4", "#2DD4BF", "#10B981"];

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { playSuccess, playTransition } = useSound();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const heartbeatRef = useRef<SVGPathElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    playTransition();

    const token = searchParams.get("accessToken");
    if (token) {
      useAuthStore.getState().setTokens({ accessToken: token, refreshToken: "" });
      authService.getMe().then(({ data }) => {
        const user = data.data;
        if (user) {
          useAuthStore.getState().login(user, { accessToken: token, refreshToken: "" });
          playSuccess();
          redirectUser(user);
        }
      }).catch(() => navigate("/login"));
    }
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    if (heartbeatRef.current) {
      const length = heartbeatRef.current.getTotalLength();
      gsap.fromTo(heartbeatRef.current, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" });
    }

    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll(".word");
      gsap.fromTo(words, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" });
    }
  }, [shouldReduceMotion]);

  const redirectUser = (user: { role: string; status: string }) => {
    if (user.role === "admin") {
      navigate("/admin", { replace: true });
    } else if ((user.role === "doctor" || user.role === "nurse" || user.role === "rural_health_officer") && user.status === "pending") {
      navigate("/pending", { replace: true });
    } else {
      authService.getOnboardingStatus().then(({ data }) => {
        if (data.data?.completed) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }).catch(() => navigate("/dashboard", { replace: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data: response } = await authService.login(email, password);
      const payload = response.data;
      if (!payload) {
        throw new Error(response.error?.message ?? "Login failed");
      }
      useAuthStore.getState().login(payload.user, { accessToken: payload.accessToken, refreshToken: "" });
      playSuccess();
      redirectUser(payload.user);
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      const msg = err?.response?.data?.error?.message ?? "Connection failed. Check your internet.";
      if (code === "ACCOUNT_PENDING") setError({ type: "info", message: msg });
      else if (code === "ACCOUNT_SUSPENDED") setError({ type: "danger", message: msg });
      else if (code === "ACCOUNT_REJECTED") setError({ type: "danger", message: msg });
      else setError({ type: "danger", message: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="relative hidden w-3/5 overflow-hidden bg-gradient-to-br from-fcn-primary to-fcn-dark md:block">
        <div className="absolute inset-0 opacity-[0.03]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="medical-cross" style={{ left: `${(i * 9 + 3) % 100}%`, top: `${(i * 7 + 5) % 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + (i % 3)}s` }} />
          ))}
        </div>

        <div className="absolute left-8 top-8 z-10">
          <div className="text-3xl font-extrabold tracking-tight text-white">FCN</div>
          <div className="text-sm font-medium text-white/70">Foundation Care Network</div>
        </div>

        <div className="relative z-10 flex h-full flex-col justify-center px-16 pb-24">
          <svg className="mb-8 h-20 w-full" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path ref={heartbeatRef} d="M0,40 L80,40 L100,40 L110,10 L120,70 L135,20 L150,60 L165,30 L180,50 L200,40 L220,40 L240,40 L250,20 L260,60 L275,30 L290,55 L310,10 L325,70 L340,40 L400,40" fill="none" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <h1 ref={headlineRef} className="mb-6 text-5xl font-bold leading-tight text-white">
            {"Healthcare Without Walls".split(" ").map((word, i) => (
              <span key={i} className="word mr-3 inline-block opacity-0">{word}</span>
            ))}
          </h1>

          <div ref={pillsRef} className="flex flex-wrap gap-3">
            {featurePills.map((pill, i) => (
              <motion.div key={pill.text} initial={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined} animate={{ opacity: 1, x: 0 }} transition={{ delay: shouldReduceMotion ? 0 : 0.3 + i * 0.2 }}>
                <span className="inline-flex items-center gap-2 rounded-full bg-fcn-accent/20 px-4 py-2 text-sm font-medium text-fcn-accent backdrop-blur-sm">
                  <pill.icon className="h-4 w-4" /> {pill.text}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-3">
            {avatarColors.map((color, i) => (
              <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 text-sm font-bold text-white" style={{ backgroundColor: color }}>{["JD", "AK", "MR"][i]}</div>
            ))}
            <span className="text-sm text-white/60">Trusted by doctors across Dire Dawa, Ethiopia</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 dark:bg-fcn-dark md:w-2/5 md:px-10">
        <motion.div initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined} animate={{ opacity: 1, x: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.4 }} className="w-full max-w-sm">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Welcome back</h2>
            <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">Sign in to your FCN account</p>
          </div>

          <a href={`${VITE_API_URL}/auth/google`} className="flex w-full items-center justify-center gap-3 rounded-md border border-fcn-primary/20 bg-white px-4 py-2.5 text-sm font-medium text-fcn-text-light shadow-sm transition hover:shadow-md dark:bg-fcn-dark dark:text-fcn-text-dark">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </a>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-fcn-primary/10" />
            <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">or continue with email</span>
            <span className="h-px flex-1 bg-fcn-primary/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div initial={!shouldReduceMotion ? { opacity: 0, y: -10 } : undefined} animate={{ opacity: 1, y: 0 }} exit={!shouldReduceMotion ? { opacity: 0, y: -10 } : undefined} className={`rounded-md px-4 py-2.5 text-sm ${error.type === "info" ? "bg-fcn-accent/10 text-fcn-accent" : error.type === "danger" ? "bg-fcn-danger/10 text-fcn-danger" : "bg-fcn-warning/10 text-fcn-warning"}`}>
                  {error.message}
                </motion.div>
              )}
            </AnimatePresence>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Email</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white pl-10 pr-3 text-sm text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/45 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/45" placeholder="you@example.com" aria-label="Email address" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">Password</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-11 w-full rounded-md border border-fcn-primary/20 bg-white pl-10 pr-10 text-sm text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/45 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/45" placeholder="••••••••" aria-label="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-fcn-primary/60 hover:text-fcn-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="text-right">
              <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-medium text-fcn-primary hover:underline">Forgot password?</button>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-fcn-primary hover:underline">Register here</Link>
          </p>
        </motion.div>
      </div>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};

export default LoginPage;