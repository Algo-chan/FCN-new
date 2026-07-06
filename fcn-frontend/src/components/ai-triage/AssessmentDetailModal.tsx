import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import { format } from "date-fns";
import { Sparkles, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { getAssessmentById } from "@/services/ai-triage.service";
import { FinalAssessmentCard } from "./FinalAssessmentCard";
import type { ConversationMessage, ParsedAssessment } from "@/types";

const languageLabels: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  am: { name: "አማርኛ", flag: "🇪🇹" },
  so: { name: "Soomaali", flag: "🇸🇴" },
  om: { name: "Afaan Oromoo", flag: "🇪🇹" }
};

function parseMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  }
  html = "<p>" + html + "</p>";
  return html;
}

interface AssessmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
}

export const AssessmentDetailModal = ({ isOpen, onClose, assessmentId }: AssessmentDetailModalProps) => {
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    getAssessmentById(assessmentId)
      .then((res) => {
        if (res.success && res.data) {
          setAssessment(res.data);
        } else {
          setError(res.error?.message || "Failed to load assessment");
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || "Failed to load assessment");
      })
      .finally(() => setLoading(false));
  }, [isOpen, assessmentId]);

  const parseConversation = (conv: any): ConversationMessage[] => {
    if (!conv) return [];
    if (Array.isArray(conv)) return conv;
    try {
      return JSON.parse(conv);
    } catch {
      return [];
    }
  };

  const parseFinalAssessmentObj = (text: string | undefined): ParsedAssessment | null => {
    if (!text) return null;
    try {
      const match = text.match(/\{[\s\S]*"risk_level"[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch { }
    return null;
  };

  const langInfo = assessment ? (languageLabels[assessment.language] || languageLabels.en) : { name: "", flag: "" };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assessment Details" size="xl">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-fcn-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-fcn-danger/10 p-4 text-sm text-fcn-danger">
          {error}
        </div>
      )}

      {assessment && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                {format(new Date(assessment.created_at), "MMM d, yyyy · h:mm a")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm">{langInfo.flag} {langInfo.name}</span>
                {assessment.risk_level && (
                  <Badge
                    variant={
                      assessment.risk_level === "LOW" ? "success" :
                      assessment.risk_level === "MEDIUM" ? "warning" :
                      "danger"
                    }
                    size="sm"
                  >
                    {assessment.risk_level}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {assessment.initial_symptoms && (
            <div>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                Initial Symptoms Reported
              </h4>
              <p className="rounded-lg bg-fcn-primary/5 px-3 py-2 text-sm text-fcn-text-light dark:text-fcn-text-dark">
                {assessment.initial_symptoms}
              </p>
            </div>
          )}

          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Full Conversation
            </h4>
            <div className="space-y-3">
              {parseConversation(assessment.conversation).map((msg: ConversationMessage, idx: number) => {
                const isUser = msg.role === "user";
                const prevMsg = idx > 0 ? parseConversation(assessment.conversation)[idx - 1] : null;
                const showRoundSep = msg.round && (!prevMsg || prevMsg.round !== msg.round);

                return (
                  <div key={idx}>
                    {showRoundSep && (
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-px flex-1 bg-fcn-accent/30" />
                        <span className="text-xs font-medium text-fcn-accent">Round {msg.round}</span>
                        <div className="h-px flex-1 bg-fcn-accent/30" />
                      </div>
                    )}
                    <div className={clsx("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
                      {isUser ? (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fcn-primary/20 text-[10px] font-medium text-fcn-primary">
                          U
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fcn-accent/20">
                          <Sparkles className="h-3 w-3 text-fcn-accent" />
                        </div>
                      )}
                      <div
                        className={clsx(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          isUser
                            ? "rounded-br-sm bg-gradient-to-r from-fcn-accent to-fcn-accent/80 text-white"
                            : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-fcn-primary/10 pt-4">
            {assessment.is_complete ? (
              <FinalAssessmentCard
                assessment={parseFinalAssessmentObj(assessment.final_assessment) || {
                  risk_level: "MEDIUM",
                  risk_explanation: "Assessment details could not be parsed.",
                  likely_causes: [],
                  recommended_specialty: "General Medicine",
                  recommended_actions: ["Consult a healthcare professional"],
                  warning_signs: ["Seek care if symptoms worsen"],
                  home_care_tips: [],
                  disclaimer: "This assessment is AI-generated guidance only."
                }}
              />
            ) : (
              <div className="rounded-lg bg-fcn-warning/10 p-4 text-center text-sm text-fcn-warning">
                Assessment was not completed
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
