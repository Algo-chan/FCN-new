import { useState, useRef, type DragEvent } from "react";
import { Camera, UploadCloud, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";

interface DoctorPhotoUploaderProps {
  photoUrl?: string | null;
  onPhotoUploaded: (url: string, publicId: string) => void;
  onPhotoRemoved: () => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const DoctorPhotoUploader = ({
  photoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  disabled = false
}: DoctorPhotoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, and WebP images are supported";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Photo file size cannot exceed 5MB";
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const response = await authService.uploadDoctorRegistrationPhoto(file);
      const data = response.data.data;
      if (data?.photo_url) {
        setPreviewUrl(data.photo_url);
        onPhotoUploaded(data.photo_url, data.photo_public_id);
      } else {
        throw new Error("Invalid response from image server");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to upload photo. Please try again.";
      setErrorMessage(msg);
      setPreviewUrl(photoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setErrorMessage(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onPhotoRemoved();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70">
          Professional Profile Photo
        </label>
        <span className="text-[11px] text-fcn-primary dark:text-fcn-accent font-medium">
          Displayed in search results
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {previewUrl ? (
        <div className="relative flex items-center gap-4 rounded-xl border border-teal-500/30 bg-teal-50/50 p-3.5 dark:border-teal-500/20 dark:bg-teal-950/20">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-teal-500 bg-slate-100 shadow-md dark:bg-slate-800">
            <img
              src={previewUrl}
              alt="Doctor preview"
              className="h-full w-full object-cover object-top"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Portrait Photo Ready</span>
            </div>
            <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {isUploading
                ? "Optimizing and uploading to Cloudinary CDN..."
                : "Centered and formatted for your clinical badge & doctor search."}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 rounded-md border border-teal-600/30 bg-white px-2.5 py-1 text-xs font-medium text-teal-700 shadow-sm transition hover:bg-teal-50 dark:bg-slate-800 dark:text-teal-300 dark:hover:bg-slate-700"
              >
                <Camera className="h-3 w-3" />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-50/50 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
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
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all ${
            isDragging
              ? "border-fcn-primary bg-fcn-primary/10 dark:border-fcn-accent"
              : "border-fcn-primary/25 bg-fcn-primary/[0.02] hover:border-fcn-primary/50 hover:bg-fcn-primary/[0.05] dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-white/30"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2">
              <Loader2 className="h-8 w-8 animate-spin text-fcn-primary dark:text-fcn-accent" />
              <p className="mt-2 text-xs font-medium text-fcn-primary dark:text-fcn-accent">
                Uploading to Cloudinary...
              </p>
            </div>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fcn-primary/10 text-fcn-primary group-hover:scale-110 transition-transform dark:bg-fcn-accent/15 dark:text-fcn-accent">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                Click to upload portrait photo or drag and drop
              </p>
              <p className="mt-1 text-[11px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                JPG, PNG, WebP up to 5MB (Professional doctor portrait recommended)
              </p>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
