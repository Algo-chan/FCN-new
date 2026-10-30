import { useState, useRef, type DragEvent } from "react";
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
  FileText,
  UploadCloud,
  X,
  Camera,
  Loader2,
  CheckCircle2,
  Link2
} from "lucide-react";
import toast from "react-hot-toast";
import { MASTER_SPECIALTIES } from "@/constants/specialties";
import { articleService } from "@/services/article.service";
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

  // Cover image upload states
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  // In-article inline image upload states
  const [isUploadingInline, setIsUploadingInline] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

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

  const handleCoverUpload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image cannot exceed 5MB");
      return;
    }

    setIsUploadingCover(true);
    try {
      const res = await articleService.uploadArticleImage(file);
      if (res?.url) {
        setCoverImageUrl(res.url);
        toast.success("Cover image uploaded to Cloudinary!");
      } else {
        throw new Error("Upload did not return an image URL");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to upload cover image");
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleInlineImageUpload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image cannot exceed 5MB");
      return;
    }

    setIsUploadingInline(true);
    try {
      const res = await articleService.uploadArticleImage(file);
      if (res?.url) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[\[\]]/g, "");
        insertFormatting(`\n![${cleanName || "Clinical Illustration"}](${res.url})\n`);
        toast.success("Clinical image inserted into article!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to upload inline image");
    } finally {
      setIsUploadingInline(false);
      if (inlineInputRef.current) inlineInputRef.current.value = "";
    }
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
      {/* Hidden file inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCoverUpload(file);
        }}
      />
      <input
        ref={inlineInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleInlineImageUpload(file);
        }}
      />

      {/* Main Metadata Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Article Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Managing Hypertension in Ethiopian Climates: A Doctor's Protocol"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-base sm:text-lg font-bold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Specialty Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Medical Specialty / Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              {MASTER_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Cloudinary Article Cover Image Uploader */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cover Image (Cloudinary)
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Link2 className="h-3 w-3" />
                {showUrlInput ? "Upload File" : "Paste URL"}
              </button>
            </div>

            {showUrlInput ? (
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
            ) : coverImageUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-50 dark:bg-slate-800/60 p-2 flex items-center gap-3">
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="h-16 w-24 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Cover Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Cloudinary CDN optimized
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <Camera className="h-3 w-3" />
                      Change
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => setCoverImageUrl("")}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    coverInputRef.current?.click();
                  }
                }}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setIsDraggingCover(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingCover(true);
                }}
                onDragLeave={() => setIsDraggingCover(false)}
                className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-3 text-center transition-all ${
                  isDraggingCover
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-200 hover:border-teal-500/50 bg-slate-50/70 hover:bg-slate-100/70 dark:border-white/10 dark:bg-slate-800/40"
                }`}
              >
                {isUploadingCover ? (
                  <div className="flex items-center gap-2 py-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading to Cloudinary...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-1">
                    <UploadCloud className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Upload Cover Photo (JPG, PNG, WebP)
                    </span>
                  </div>
                )}
              </div>
            )}
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

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

              {/* In-Article Cloudinary Image Inserter Button */}
              <button
                type="button"
                disabled={isUploadingInline}
                onClick={() => inlineInputRef.current?.click()}
                title="Upload & Insert Clinical Image or Chart to Cloudinary"
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-50/70 px-2.5 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/20 dark:bg-teal-950/30 dark:text-teal-300 dark:hover:bg-teal-950/50"
              >
                {isUploadingInline ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Add Image</span>
                  </>
                )}
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
            placeholder="Write your clinical article using Markdown formatting. Use ## for section headings, - for bullet lists, > for clinical callouts, and the 'Add Image' button to insert diagrams..."
            className="w-full bg-transparent p-6 text-base font-normal text-slate-900 leading-relaxed placeholder:text-slate-400 focus:outline-none dark:text-slate-100 font-sans"
          />
        ) : (
          <div className="p-8 max-w-3xl mx-auto min-h-[400px]">
            {coverImageUrl && (
              <div className="mb-6 overflow-hidden rounded-2xl">
                <img
                  src={coverImageUrl}
                  alt={title}
                  className="h-64 w-full object-cover"
                />
              </div>
            )}
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
            disabled={isSubmitting || isUploadingCover || isUploadingInline}
            onClick={() => handleAction("draft")}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:bg-slate-800 dark:text-slate-200"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting || isUploadingCover || isUploadingInline}
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
