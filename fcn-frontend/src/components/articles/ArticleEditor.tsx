import { useState, useRef } from "react";
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  AlertTriangle,
  Eye,
  Edit3,
  Image as ImageIcon,
  Clock,
  FileText
} from "lucide-react";
import { MASTER_SPECIALTIES } from "@/constants/specialties";
import type { CreateArticleInput } from "@/types";

interface ArticleEditorProps {
  initialValues?: {
    title?: string;
    excerpt?: string;
    category?: string;
    cover_image_url?: string | null;
    content?: string;
  };
  onSubmit: (data: CreateArticleInput, action: "draft" | "pending_review") => Promise<void>;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export const ArticleEditor = ({
  initialValues,
  onSubmit,
  isSubmitting,
  isEditing = false
}: ArticleEditorProps) => {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt || "");
  const [category, setCategory] = useState(initialValues?.category || MASTER_SPECIALTIES[0]);
  const [coverImageUrl, setCoverImageUrl] = useState(initialValues?.cover_image_url || "");
  const [content, setContent] = useState(initialValues?.content || "");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Word count & reading time calculation
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const insertFormatting = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = prefix + (selected || "sample text") + suffix;

    const newContent =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : "sample text".length)
      );
    }, 0);
  };

  const handleAction = async (targetStatus: "draft" | "pending_review") => {
    if (!title.trim()) {
      alert("Please provide a title for the article");
      return;
    }
    if (!excerpt.trim()) {
      alert("Please provide a short summary/excerpt for the article");
      return;
    }
    if (!content.trim() || content.trim().length < 50) {
      alert("Article content must be at least 50 characters");
      return;
    }

    await onSubmit(
      {
        title: title.trim(),
        excerpt: excerpt.trim(),
        category,
        cover_image_url: coverImageUrl.trim() || null,
        content: content.trim(),
        status: targetStatus
      },
      targetStatus
    );
  };

  return (
    <div className="space-y-6">
      {/* Article Metadata Form */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Article Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Managing Hypertension in Ethiopia: Dietary Habits, Teff, and Blood Pressure"
            maxLength={200}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-bold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>Make it informative, clinical, and directly relevant to Ethiopian patients</span>
            <span>{title.length}/200</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Medical Specialty Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              {MASTER_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Cover Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Short Clinical Summary / Excerpt <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="A 2-3 sentence overview highlighting what patients will learn and why it matters."
            className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>This excerpt is indexed by Google search and displayed on article preview cards</span>
            <span>{excerpt.length}/500</span>
          </div>
        </div>
      </div>

      {/* Editor & Preview Toolbar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 overflow-hidden">
        {/* Top bar with tabs & formatting tools */}
        <div className="border-b border-slate-200/80 bg-slate-50/70 p-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 dark:border-white/10 dark:bg-slate-800/50">
          {/* Edit / Preview Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "edit"
                  ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Patient Preview</span>
            </button>
          </div>

          {/* Formatting Shortcuts (Active in Edit tab) */}
          {activeTab === "edit" && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormatting("## ", "\n")}
                title="Heading 2"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("### ", "\n")}
                title="Heading 3"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Heading3 className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                title="Bold"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                title="Italic"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Italic className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting("\n- ")}
                title="Bullet List"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n1. ")}
                title="Numbered List"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormatting(
                    "\n> **Clinical Note:** ",
                    "\n"
                  )
                }
                title="Clinical Callout"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Quote className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormatting(
                    "\n> **Medical Disclaimer:** This guide is for educational awareness and does not replace personalized medical advice.\n"
                  )
                }
                title="Medical Disclaimer Box"
                className="rounded-lg p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Word Count & Reading Time Indicator */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {wordCount} words
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{readingTimeMinutes} min read
            </span>
          </div>
        </div>

        {/* Editor Body */}
        {activeTab === "edit" ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            placeholder="Write your clinical article using Markdown formatting. Use ## for section headings, - for bullet lists, and > for clinical callouts..."
            className="w-full bg-transparent p-6 text-base font-normal text-slate-900 leading-relaxed placeholder:text-slate-400 focus:outline-none dark:text-slate-100 font-sans"
          />
        ) : (
          <div className="p-8 max-w-3xl mx-auto min-h-[400px]">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
              {title || "Untitled Article"}
            </h1>
            {excerpt && (
              <p className="border-l-4 border-teal-500 pl-4 text-base italic text-slate-600 dark:text-slate-300 mb-8">
                {excerpt}
              </p>
            )}
            <div className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {content || "No content yet. Click 'Write' to start drafting your article."}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <strong>Review Policy:</strong> Submitted articles are reviewed by FCN Super Admins before
          being indexed by Google and made visible to patients.
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction("draft")}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:bg-slate-800 dark:text-slate-200"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction("pending_review")}
            className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isSubmitting ? "Submitting..." : "Submit for FCN Review"}
          </button>
        </div>
      </div>
    </div>
  );
};
