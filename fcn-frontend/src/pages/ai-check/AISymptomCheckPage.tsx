import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Info,
  ChevronLeft,
  RefreshCw,
  Share2,
  Printer,
  ShieldCheck,
  Clock,
  Activity,
  History,
  MessageSquareHeart,
  Plus
} from "lucide-react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import toast from "react-hot-toast";
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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
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

const COMMON_SYMPTOM_TAGS: Record<string, string[]> = {
  en: ["Headache", "Fever", "Cough", "Sore throat", "Fatigue", "Chest tightness", "Stomach ache", "Nausea"],
  am: ["ራስ ምታት", "ትኩሳት", "ሳል", "የጉሮሮ ህመም", "የድካም ስሜት", "የደረት ህመም", "የሆድ ህመም", "ማቅለሽለሽ"],
  so: ["Madax xanuun", "Qandho", "Qufac", "Cune xanuun", "Daal", "Xabad xanuun", "Calool xanuun", "Lallabbo"],
  om: ["Mataa dhukkubbi", "Ho'a qaamaa", "Qufaa", "Qoonqo dhukkubbi", "Bututaa", "Laphee dhukkubbi", "Garaa kaasa", "Baqee"]
};

const LOADING_MESSAGES: Record<string, string[]> = {
  en: [
    "Analyzing your symptoms...",
    "Reviewing your medical history...",
    "Consulting clinical guidelines...",
    "Preparing your personalized assessment..."
  ],
  am: [
    "ምልክቶችዎን በመተንተን ላይ...",
    "የህክምና ታሪክዎን በመገምገም ላይ...",
    "የህክምና እውቀትን በማማከር ላይ...",
    "ግምገማዎን በማዘጋጀት ላይ..."
  ],
  so: [
    "Falanqaynta calaamadahaaga...",
    "Dib u eegista taariikhdaada caafimaad...",
    "La-tashiga aqoonta caafimaadka...",
    "Diyaarinta qiimeyntaada..."
  ],
  om: [
    "Mallattoolee keessan xiinxalaa jira...",
    "Seenaa yaala keessan ilaalaa jira...",
    "Beekumsa yaalaa gorshee jira...",
    "Qorannoo keessan qopheessaa jira..."
  ]
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
};

const PREFERRED_LANG_KEY = "fcn_preferred_language";

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
  const [incompleteBanner, setIncompleteBanner] = useState<{ id: string; timeAgo: string } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const severityNumRef = useRef<HTMLSpanElement>(null);
  const sparkleRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { playTransition, playNotification } = useSound();

  const langCode = store.language || localStorage.getItem(PREFERRED_LANG_KEY) || "en";

  useEffect(() => {
    if (sparkleRef.current && !shouldReduceMotion) {
      gsap.to(sparkleRef.current, {
        rotation: 360,
        duration: 8,
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

  useEffect(() => {
    const savedLang = localStorage.getItem(PREFERRED_LANG_KEY) as SupportedLanguage | null;
    if (savedLang && !store.language) {
      store.setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    if (store.isLoading) {
      const msgInterval = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % 4);
      }, 2000);
      const progressInterval = setInterval(() => {
        setLoadingProgress((p) => {
          if (p >= 70) return 70;
          return p + 2.5;
        });
      }, 100);
      return () => {
        clearInterval(msgInterval);
        clearInterval(progressInterval);
      };
    } else {
      setLoadingProgress(100);
      setLoadingMessageIndex(0);
    }
  }, [store.isLoading]);

  useEffect(() => {
    checkIncomplete();
  }, []);

  const checkIncomplete = async () => {
    try {
      const res = await apiGetHistory(1);
      if (res.success && res.data) {
        const incomplete = res.data.data?.find((item: any) => !item.is_complete);
        if (incomplete) {
          const timeAgo = getTimeAgo(incomplete.created_at);
          setIncompleteBanner({ id: incomplete.id, timeAgo });
        }
      }
    } catch { }
  };

  const getTimeAgo = (d: string): string => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

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
    localStorage.setItem(PREFERRED_LANG_KEY, lang);
    setDirection(1);
    setPageState("symptoms_input");
    playTransition();
  };

  const handleBackToLanguage = () => {
    setDirection(-1);
    setPageState("language_select");
  };

  const handleAddSymptomTag = (tag: string) => {
    if (symptoms.includes(tag)) return;
    setSymptoms((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      return `${trimmed}, ${tag}`;
    });
  };

  const handleStartAssessment = async () => {
    if (!store.language || symptoms.length < 5) return;

    setStarting(true);
    setLoadingProgress(0);
    setLoadingMessageIndex(0);
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
    setLoadingProgress(0);
    setLoadingMessageIndex(0);
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
      setLoadingProgress(100);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message || "AI service temporarily unavailable";
      store.setError(
        `${errMsg}. Your conversation is saved. Try again in a few minutes.`
      );
    }
  };

  const handleRetry = async () => {
    if (!store.assessmentId || store.conversation.length < 2) return;
    setRetrying(true);
    store.setError("");
    const lastUserMsg = [...store.conversation].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      await handleSendMessage(lastUserMsg.content);
    }
    setRetrying(false);
  };

  const handleSkipToAssessment = async () => {
    if (!store.assessmentId) return;

    store.setLoading(true);
    setLoadingProgress(0);
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

  const handleResumeIncomplete = async (id: string) => {
    setIncompleteBanner(null);
    store.reset();
    store.setAssessmentId(id);
    setPageState("conversation");
    setActiveTab("new");
  };

  const handleStartFresh = () => {
    setIncompleteBanner(null);
  };

  const handleShareAssessment = () => {
    if (!store.finalAssessment) return;
    const text = `Fast Care Now AI Assessment — ${new Date().toLocaleDateString()}
Risk Level: ${store.finalAssessment.risk_level}
Symptoms: ${store.conversation.find((m) => m.role === "user")?.content?.split("\n")[0] || "N/A"}
Recommended: See ${store.finalAssessment.recommended_specialty || "a doctor"}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Assessment summary copied!");
    }).catch(() => {
      toast.error("Could not copy to clipboard");
    });
  };

  const handlePrintAssessment = () => {
    window.print();
  };

  const handleResumeFromHistory = (id: string) => {
    store.reset();
    store.setAssessmentId(id);
    setPageState("conversation");
    setActiveTab("new");
  };

  const severityColor = (() => {
    if (severity <= 3) return "text-emerald-500 dark:text-emerald-400";
    if (severity <= 6) return "text-amber-500 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
  })();

  const loadingTexts = LOADING_MESSAGES[langCode] || LOADING_MESSAGES.en;
  const isWaitingForApi = starting || store.isLoading;
  const commonTags = COMMON_SYMPTOM_TAGS[langCode] || COMMON_SYMPTOM_TAGS.en;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24 md:pb-8">
      {/* Page Header */}
      <PageHeader
        title="AI Health Triage"
        description="Instant clinical symptom assessment and doctor recommendations powered by Fast Care AI"
        icon={Sparkles}
        iconVariant="violet"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI Guidance Only — Not a Diagnosis
          </span>
        }
      />

      {/* Incomplete assessment resume banner */}
      {incompleteBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fcn-primary/5 to-transparent p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  Resume previous check?
                </p>
                <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  You have an incomplete assessment from {incompleteBanner.timeAgo}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleResumeIncomplete(incompleteBanner.id)}
              >
                Continue Assessment
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleStartFresh}
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs: New vs History (if past language selection) */}
      {pageState !== "language_select" && (
        <div className="flex border-b border-fcn-primary/10 gap-6">
          <button
            onClick={() => { setActiveTab("new"); setDirection(1); }}
            className={clsx(
              "relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2",
              activeTab === "new"
                ? "text-fcn-primary dark:text-fcn-accent"
                : "text-fcn-text-light/50 hover:text-fcn-text-light dark:text-fcn-text-dark/50"
            )}
          >
            <MessageSquareHeart className="h-4 w-4" />
            New Assessment
            {activeTab === "new" && (
              <motion.div
                layoutId="ai-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fcn-primary to-fcn-accent"
              />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("history"); }}
            className={clsx(
              "relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2",
              activeTab === "history"
                ? "text-fcn-primary dark:text-fcn-accent"
                : "text-fcn-text-light/50 hover:text-fcn-text-light dark:text-fcn-text-dark/50"
            )}
          >
            <History className="h-4 w-4" />
            Past Assessments
            {activeTab === "history" && (
              <motion.div
                layoutId="ai-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fcn-primary to-fcn-accent"
              />
            )}
          </button>
        </div>
      )}

      {/* Loading Bar when calling AI */}
      {isWaitingForApi && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-fcn-primary/5 to-transparent p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-5 w-5 animate-spin text-violet-500" />
            <div className="h-2 flex-1 max-w-md rounded-full bg-fcn-primary/10 overflow-hidden">
              <motion.div
                ref={progressRef}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fcn-primary to-fcn-accent"
                initial={{ width: "0%" }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingMessageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-center text-sm font-medium text-fcn-text-light/80 dark:text-fcn-text-dark/80"
            >
              {loadingTexts[loadingMessageIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
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
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-fcn-primary" />
              </div>
            ) : historyData && historyData.data.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {historyData.data.map((item) => (
                  <AssessmentHistoryCard
                    key={item.id}
                    {...item}
                    onView={(id) => setModalAssessmentId(id)}
                    onResume={(id) => handleResumeFromHistory(id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <History className="mx-auto mb-3 h-12 w-12 text-fcn-text-light/20" />
                <h3 className="text-base font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  No assessments yet
                </h3>
                <p className="mt-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  Start your first AI health check to record and track triage history.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => { setActiveTab("new"); setPageState("symptoms_input"); }}
                >
                  Start New Check
                </Button>
              </Card>
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
            className="flex justify-center py-4"
          >
            <LanguageSelector
              onSelect={handleLanguageSelect}
              defaultLanguage={store.language || (localStorage.getItem(PREFERRED_LANG_KEY) as SupportedLanguage) || undefined}
            />
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Symptoms Input Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBackToLanguage}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-fcn-primary hover:text-fcn-accent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Language Selection
                  </button>
                  <div className="flex items-center gap-2 rounded-full border border-fcn-primary/10 bg-white/60 dark:bg-fcn-dark/60 px-3 py-1 shadow-sm">
                    <span className="text-base">{LANGUAGE_CONFIGS[langCode]?.flag || "🇬🇧"}</span>
                    <span className="text-xs font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                      {LANGUAGE_CONFIGS[langCode]?.name || "English"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-fcn-primary/15 bg-white dark:bg-fcn-dark p-5 sm:p-6 shadow-sm space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                      {LANGUAGE_HEADINGS[langCode] || LANGUAGE_HEADINGS.en}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                      Tap common symptoms below or describe in your own words.
                    </p>
                  </div>

                  {/* Quick Symptom Chips */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      Common Symptoms (Tap to Add)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {commonTags.map((tag) => {
                        const isSelected = symptoms.toLowerCase().includes(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddSymptomTag(tag)}
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                              isSelected
                                ? "bg-fcn-primary text-white shadow-sm"
                                : "bg-fcn-primary/5 text-fcn-text-light/80 dark:text-fcn-text-dark/80 hover:bg-fcn-primary/15 border border-fcn-primary/10"
                            )}
                          >
                            <Plus className={clsx("h-3 w-3", isSelected && "rotate-45")} />
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder={LANGUAGE_PLACEHOLDERS[langCode] || LANGUAGE_PLACEHOLDERS.en}
                      rows={5}
                      maxLength={1000}
                      className="w-full resize-none rounded-xl border border-fcn-primary/20 bg-fcn-surface-light dark:bg-fcn-surface-dark px-4 py-3 text-sm text-fcn-text-light placeholder:text-fcn-text-light/40 outline-none transition-all focus:border-fcn-primary focus:ring-2 focus:ring-fcn-primary/20 dark:text-fcn-text-dark"
                    />
                    <div className="mt-1.5 flex justify-between text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                      <span>Minimum 5 characters</span>
                      <span>{symptoms.length}/1000</span>
                    </div>
                  </div>

                  {/* Duration Chips */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      How long have you had these symptoms?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setDuration(opt === duration ? "" : opt)}
                          className={clsx(
                            "rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border text-center active:scale-95",
                            opt === duration
                              ? "bg-fcn-primary text-white border-fcn-primary shadow-sm"
                              : "bg-fcn-surface-light dark:bg-fcn-surface-dark border-fcn-primary/10 text-fcn-text-light dark:text-fcn-text-dark hover:border-fcn-primary/30"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity Slider */}
                  <div className="rounded-xl border border-fcn-primary/10 bg-fcn-surface-light/50 dark:bg-fcn-surface-dark/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                        Symptom Severity
                      </label>
                      <div className="flex items-baseline gap-1.5">
                        <span ref={severityNumRef} className={clsx("text-2xl font-black", severityColor)}>
                          {severity}
                        </span>
                        <span className="text-xs font-semibold text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                          / 10
                        </span>
                        <span className={clsx("ml-1 text-xs font-bold", severityColor)}>
                          {severity <= 3 ? "• Mild" : severity <= 6 ? "• Moderate" : "• Severe"}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={severity}
                      onChange={(e) => setSeverity(parseInt(e.target.value))}
                      className="w-full h-2 bg-fcn-primary/10 rounded-lg appearance-none cursor-pointer accent-fcn-primary"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-fcn-text-light/40 dark:text-fcn-text-dark/40 font-medium">
                      <span>1 - Barely noticeable</span>
                      <span>5 - Uncomfortable</span>
                      <span>10 - Unbearable</span>
                    </div>
                  </div>

                  {/* Start AI Assessment Button (Always accessible directly below the form) */}
                  <div className="pt-3">
                    <Button
                      size="lg"
                      onClick={handleStartAssessment}
                      disabled={symptoms.trim().length < 5 || starting}
                      loading={starting}
                      variant="primary"
                      className="w-full min-h-[52px] text-base font-bold shadow-lg shadow-fcn-primary/25 hover:shadow-fcn-primary/40 active:scale-[0.98] transition-all"
                    >
                      <Sparkles className="h-5 w-5 mr-1.5" />
                      {starting
                        ? (LANGUAGE_CONFIGS[langCode]?.thinkingText || "Analyzing...")
                        : "Start AI Assessment"}
                    </Button>
                    {symptoms.trim().length > 0 && symptoms.trim().length < 5 && (
                      <p className="mt-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Please enter at least 5 characters to start ({symptoms.trim().length}/5).
                      </p>
                    )}
                  </div>

                  {store.error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                      <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{store.error}</p>
                      <button
                        onClick={() => store.setError(null)}
                        className="mt-2 text-xs font-semibold text-rose-600/80 hover:text-rose-600 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar with Tips & Health Profile */}
              <div className="space-y-4">
                <Card className="p-5 space-y-4">
                  <h3 className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark flex items-center gap-2">
                    <Info className="h-4 w-4 text-fcn-primary" />
                    Tips for Accurate Triage
                  </h3>
                  <ul className="space-y-2.5 text-xs text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                    <li className="flex items-start gap-2">
                      <span className="text-fcn-primary font-bold">1.</span>
                      <span>Be specific about body location and when the symptoms began.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-fcn-primary font-bold">2.</span>
                      <span>Note any triggers (eating, exertion, lying down).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-fcn-primary font-bold">3.</span>
                      <span>Mention any fever readings or medications already taken.</span>
                    </li>
                  </ul>
                </Card>

                {/* Patient Profile Context Card */}
                <div className="rounded-2xl border border-fcn-accent/20 bg-gradient-to-br from-fcn-accent/10 to-transparent p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-fcn-accent" />
                    <span className="text-xs font-bold text-fcn-accent uppercase tracking-wider">
                      Health Profile Included
                    </span>
                  </div>
                  <p className="text-xs text-fcn-text-light/70 dark:text-fcn-text-dark/70 leading-relaxed">
                    The AI considers your recorded{" "}
                    <strong>
                      {patientProfile?.chronic_conditions?.length > 0
                        ? patientProfile.chronic_conditions.join(", ")
                        : "health profile & vitals"}
                    </strong>{" "}
                    during clinical risk calculation.
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
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{store.error}</p>
                {store.conversation.length > 0 && (
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-rose-600/10 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-600/20 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={clsx("h-3.5 w-3.5", retrying && "animate-spin")} />
                    Retry Message
                  </button>
                )}
              </div>
            )}

            {showFinalCard && store.finalAssessment && (
              <div className="space-y-4">
                <FinalAssessmentCard
                  assessment={store.finalAssessment}
                  onBookConsultation={handleBookConsultation}
                  onSaveAndReturn={handleSaveAndReturn}
                  onStartNew={handleStartOver}
                />
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShareAssessment}
                  >
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Share with Doctor
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrintAssessment}
                  >
                    <Printer className="h-4 w-4 mr-1.5" />
                    Print Assessment
                  </Button>
                </div>
              </div>
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
