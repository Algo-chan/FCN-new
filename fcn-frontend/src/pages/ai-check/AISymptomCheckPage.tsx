import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Loader2, Info, ChevronLeft } from "lucide-react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/auth.store";
import { useAITriageStore } from "@/store/ai-triage.store";
import {
  startAssessment as apiStartAssessment,
  continueConversation as apiContinueConversation,
  completeAssessment as apiCompleteAssessment,
  getAssessmentHistory as apiGetHistory,
  markBookingInitiated as apiMarkBooking
} from "@/services/ai-triage.service";
import type { AssessmentHistoryResponse } from "@/services/ai-triage.service";
import { LanguageSelector } from "@/components/ai-triage/LanguageSelector";
import { ConversationChat } from "@/components/ai-triage/ConversationChat";
import { FinalAssessmentCard } from "@/components/ai-triage/FinalAssessmentCard";
import { AssessmentHistoryCard } from "@/components/ai-triage/AssessmentHistoryCard";
import { AssessmentDetailModal } from "@/components/ai-triage/AssessmentDetailModal";
import { useSound } from "@/hooks/useSound";
import type { SupportedLanguage } from "@/types";

type PageState = "language_select" | "symptoms_input" | "conversation";

const LANGUAGE_HEADINGS: Record<string, string> = {
  en: "Tell us how you're feeling",
  am: "እንዴት እንደሚሰማዎ ይንገሩን",
  so: "Noo sheeg sida aad dareemeyso",
  om: "Akkaataa itti dhaga'amtu nu himi"
};

const LANGUAGE_PLACEHOLDERS: Record<string, string> = {
  en: "Describe all your symptoms in detail. For example: I have had a headache for 2 days, mild fever, and feel very tired...",
  am: "ሁሉንም ምልክቶችዎን በዝርዝር ይግለጹ። ለምሳሌ፡ ራስ ምታት ለ2 ቀናት ኖሮኛል፣ መጠነኛ ትኩሳት አለብኝ፣ እና በጣም ደክሞኛል...",
  so: "Sifee calaamadahaaga oo dhami faahfaahin. Tusaale: Waxaan qabay madax xanuun 2 maalmood, qandho khafiif ah, waxaana dareemayaa aad u daal...",
  om: "Mallattoolee keessan hunda ibsa. Fakkeenyaaf: mataa kaleen guyyaa 2 ture, ho'a xiqqaa qaba, akka malees bututaa jira..."
};

const DURATION_OPTIONS = ["< 24 hours", "1-3 days", "3-7 days", "Over a week"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
};

const AISymptomCheckPage = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const patientProfile = (authUser as any)?.patient_profile;

  const store = useAITriageStore();
  const [pageState, setPageState] = useState<PageState>("language_select");
  const [direction, setDirection] = useState(0);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState(5);
  const [starting, setStarting] = useState(false);
  const [historyData, setHistoryData] = useState<AssessmentHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalAssessmentId, setModalAssessmentId] = useState<string | null>(null);
  const [showFinalCard, setShowFinalCard] = useState(false);
  const severityNumRef = useRef<HTMLSpanElement>(null);
  const sparkleRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { playTransition, playNotification } = useSound();

  useEffect(() => {
    if (sparkleRef.current && !shouldReduceMotion) {
      gsap.to(sparkleRef.current, {
        rotation: 360,
        duration: 4,
        repeat: -1,
        ease: "none"
      });
    }
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (severityNumRef.current && !shouldReduceMotion) {
      gsap.to(severityNumRef.current, {
        scale: 1.15,
        duration: 0.15,
        onComplete: () => {
          gsap.to(severityNumRef.current, { scale: 1, duration: 0.1 });
        }
      });
    }
  }, [severity, shouldReduceMotion]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (store.isComplete && store.finalAssessment) {
      setShowFinalCard(true);
    }
  }, [store.isComplete, store.finalAssessment]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiGetHistory(1);
      if (res.success && res.data) {
        setHistoryData(res.data);
      }
    } catch { } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    store.setLanguage(lang);
    setDirection(1);
    setPageState("symptoms_input");
    playTransition();
  };

  const handleBackToLanguage = () => {
    setDirection(-1);
    setPageState("language_select");
  };

  const handleStartAssessment = async () => {
    if (!store.language || symptoms.length < 10) return;

    setStarting(true);
    try {
      let symptomsText = symptoms;
      if (duration) symptomsText += `\nDuration: ${duration}`;
      symptomsText += `\nSeverity: ${severity}/10`;

      const res = await apiStartAssessment(store.language, symptomsText);
      if (res.success && res.data) {
        store.startConversation(
          res.data.assessmentId,
          { role: "user", content: symptomsText, timestamp: new Date().toISOString() },
          { role: "assistant", content: res.data.aiResponse, round: 1, timestamp: new Date().toISOString() }
        );
        setDirection(1);
        setPageState("conversation");
        playNotification();
      } else {
        store.setError(res.error?.message || "Failed to start assessment");
      }
    } catch (err: any) {
      store.setError(err?.response?.data?.error?.message || "Failed to start assessment");
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!store.assessmentId) return;

    store.setLoading(true);
    try {
      const res = await apiContinueConversation(store.assessmentId, message);
      if (res.success && res.data) {
        if (res.data.isComplete && res.data.finalAssessment) {
          store.addMessages(
            { role: "user", content: message, timestamp: new Date().toISOString() },
            { role: "assistant", content: res.data.aiResponse, round: res.data.round, timestamp: new Date().toISOString() }
          );
          store.setComplete(res.data.finalAssessment);
        } else {
          store.addMessages(
            { role: "user", content: message, timestamp: new Date().toISOString() },
            { role: "assistant", content: res.data.aiResponse, round: res.data.round, timestamp: new Date().toISOString() }
          );
        }
      }
    } catch (err: any) {
      store.setError(err?.response?.data?.error?.message || "Failed to send message");
    }
  };

  const handleSkipToAssessment = async () => {
    if (!store.assessmentId) return;

    store.setLoading(true);
    try {
      const res = await apiCompleteAssessment(store.assessmentId);
      if (res.success && res.data && res.data.finalAssessment) {
        store.addMessages(
          { role: "user", content: "Skip to final assessment", timestamp: new Date().toISOString() },
          { role: "assistant", content: res.data.aiResponse, round: 3, timestamp: new Date().toISOString() }
        );
        store.setComplete(res.data.finalAssessment);
      }
    } catch (err: any) {
      store.setError(err?.response?.data?.error?.message || "Failed to complete assessment");
    }
  };

  const handleStartOver = () => {
    store.reset();
    setShowFinalCard(false);
    setSymptoms("");
    setDuration("");
    setSeverity(5);
    setDirection(-1);
    setPageState("language_select");
  };

  const handleBookConsultation = async () => {
    if (store.assessmentId) {
      try {
        await apiMarkBooking(store.assessmentId);
        store.setBookingInitiated();
      } catch { }
    }
    playTransition();
    navigate("/appointments/book");
  };

  const handleSaveAndReturn = () => {
    navigate("/dashboard");
  };

  const severityColor = (() => {
    if (severity <= 3) return "text-fcn-success";
    if (severity <= 6) return "text-fcn-warning";
    return "text-fcn-danger";
  })();

  const langCode = store.language || "en";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span ref={sparkleRef} className="inline-flex">
            <Sparkles className="h-5 w-5 text-fcn-accent" />
          </span>
          <h1 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            AI Health Check
          </h1>
        </div>
        <span className="rounded-full bg-fcn-warning/10 px-3 py-1 text-xs font-medium text-fcn-warning">
          AI Guidance Only — Not a Diagnosis
        </span>
      </div>

      {pageState !== "language_select" && (
        <div className="mb-6 flex gap-4 border-b border-fcn-primary/10">
          <button
            onClick={() => { setActiveTab("new"); setDirection(1); }}
            className={clsx(
              "relative pb-2 text-sm font-medium transition-colors",
              activeTab === "new"
                ? "text-fcn-primary"
                : "text-fcn-text-light/50 hover:text-fcn-text-light dark:text-fcn-text-dark/50"
            )}
          >
            New Assessment
            {activeTab === "new" && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-fcn-accent"
              />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("history"); }}
            className={clsx(
              "relative pb-2 text-sm font-medium transition-colors",
              activeTab === "history"
                ? "text-fcn-primary"
                : "text-fcn-text-light/50 hover:text-fcn-text-light dark:text-fcn-text-dark/50"
            )}
          >
            Past Assessments
            {activeTab === "history" && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-fcn-accent"
              />
            )}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {activeTab === "history" && pageState !== "language_select" ? (
          <motion.div
            key="history"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
          >
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-fcn-primary" />
              </div>
            ) : historyData && historyData.data.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {historyData.data.map((item) => (
                  <AssessmentHistoryCard
                    key={item.id}
                    {...item}
                    onView={(id) => setModalAssessmentId(id)}
                    onResume={(id) => {
                      store.reset();
                      setPageState("conversation");
                      setActiveTab("new");
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-fcn-primary/10 p-8 text-center">
                <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  No assessments yet. Start your first AI health check above.
                </p>
              </div>
            )}
          </motion.div>
        ) : pageState === "language_select" ? (
          <motion.div
            key="language"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex justify-center py-8"
          >
            <LanguageSelector onSelect={handleLanguageSelect} />
          </motion.div>
        ) : pageState === "symptoms_input" ? (
          <motion.div
            key="symptoms"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            <div className="flex gap-6">
              <div className="flex-1 space-y-5">
                <button
                  onClick={handleBackToLanguage}
                  className="flex items-center gap-1 text-sm text-fcn-primary hover:text-fcn-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Change Language
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-lg">{LANGUAGE_CONFIGS[langCode]?.flag || "🇬🇧"}</span>
                  <span className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                    {LANGUAGE_CONFIGS[langCode]?.name || "English"}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {LANGUAGE_HEADINGS[langCode] || LANGUAGE_HEADINGS.en}
                </h2>

                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={LANGUAGE_PLACEHOLDERS[langCode] || LANGUAGE_PLACEHOLDERS.en}
                  rows={5}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-fcn-primary/10 bg-white/50 px-4 py-3 text-sm text-fcn-text-light placeholder-gray-400 outline-none transition-colors focus:border-fcn-accent dark:bg-fcn-dark/50 dark:text-fcn-text-dark"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                    Symptom Duration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setDuration(opt === duration ? "" : opt)}
                        className={clsx(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                          opt === duration
                            ? "bg-fcn-accent text-white"
                            : "bg-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/20"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                    How severe are your symptoms?{" "}
                    <span ref={severityNumRef} className={clsx("inline-block text-2xl font-bold", severityColor)}>
                      {severity}
                    </span>
                    <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      {severity <= 3 ? " (Mild)" : severity <= 6 ? " (Moderate)" : " (Severe)"}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={severity}
                    onChange={(e) => setSeverity(parseInt(e.target.value))}
                    className="w-full"
                    style={{
                      accentColor: severity <= 3 ? "#10B981" : severity <= 6 ? "#FBBF24" : "#F87171"
                    }}
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                    <span>1 - Barely noticeable</span>
                    <span>10 - Extremely severe</span>
                  </div>
                </div>

                <button
                  onClick={handleStartAssessment}
                  disabled={symptoms.length < 10 || starting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-fcn-primary px-5 py-3 font-medium text-white transition-all hover:shadow-[0_0_24px_rgba(10,126,164,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {LANGUAGE_CONFIGS[langCode]?.thinkingText || "Analyzing..."}
                    </>
                  ) : (
                    "Start AI Assessment"
                  )}
                </button>
              </div>

              <div className="hidden w-72 shrink-0 space-y-4 lg:block">
                <div className="rounded-lg border border-fcn-primary/10 bg-white/50 p-4 dark:bg-fcn-dark/50">
                  <h3 className="mb-3 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    Tips for a better assessment
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                      <span>💡</span>
                      Be as specific as possible
                    </li>
                    <li className="flex items-start gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                      <span>💡</span>
                      Mention when symptoms started
                    </li>
                    <li className="flex items-start gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                      <span>💡</span>
                      Include any recent travel
                    </li>
                    <li className="flex items-start gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                      <span>💡</span>
                      List all current medications
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-fcn-accent/20 bg-fcn-accent/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-fcn-accent" />
                    <span className="text-xs font-medium text-fcn-accent">
                      Your health profile is included
                    </span>
                  </div>
                  <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    Claude AI will consider your{" "}
                    {patientProfile?.chronic_conditions?.length > 0
                      ? patientProfile.chronic_conditions.join(", ")
                      : "health profile"}{" "}
                    when analyzing your symptoms.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {store.conversation.length > 0 && (
              <ConversationChat
                language={store.language || "en"}
                conversation={store.conversation}
                currentRound={store.currentRound}
                isLoading={store.isLoading}
                isComplete={store.isComplete}
                finalAssessment={store.finalAssessment}
                onSendMessage={handleSendMessage}
                onSkipToAssessment={handleSkipToAssessment}
                onStartOver={handleStartOver}
                onBookConsultation={handleBookConsultation}
              />
            )}

            {store.error && (
              <div className="rounded-lg bg-fcn-danger/10 p-3 text-sm text-fcn-danger">
                {store.error}
              </div>
            )}

            {showFinalCard && store.finalAssessment && (
              <FinalAssessmentCard
                assessment={store.finalAssessment}
                onBookConsultation={handleBookConsultation}
                onSaveAndReturn={handleSaveAndReturn}
                onStartNew={handleStartOver}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AssessmentDetailModal
        isOpen={!!modalAssessmentId}
        onClose={() => setModalAssessmentId(null)}
        assessmentId={modalAssessmentId || ""}
      />
    </div>
  );
};

const LANGUAGE_CONFIGS: Record<string, { flag: string; name: string; thinkingText: string }> = {
  en: { flag: "🇬🇧", name: "English", thinkingText: "Analyzing your symptoms..." },
  am: { flag: "🇪🇹", name: "አማርኛ", thinkingText: "ምልክቶችዎን በመተንተን ላይ..." },
  so: { flag: "🇸🇴", name: "Soomaali", thinkingText: "Calaamadahaaga waa la falanqeynayaa..." },
  om: { flag: "🇪🇹", name: "Afaan Oromoo", thinkingText: "Malattoolee keessan xiinxalaa jira..." }
};

export default AISymptomCheckPage;
