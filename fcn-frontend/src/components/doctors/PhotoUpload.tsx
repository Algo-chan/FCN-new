import { useCallback, useRef, useState, type DragEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { clsx } from "clsx";
import { doctorsService } from "@/services/doctors.service";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";

interface PhotoUploadProps {
  currentPhotoUrl: string | null | undefined;
  doctorId: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

const shakeVariants = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.35 }
  }
};

export const PhotoUpload = ({ currentPhotoUrl, doctorId }: PhotoUploadProps) => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => doctorsService.uploadProfilePhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setPreview(null);
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      playSuccess();
      addToast({ type: "success", title: "Photo uploaded successfully" });
    },
    onError: () => {
      setIsUploading(false);
      setUploadProgress(0);
      addToast({ type: "danger", title: "Failed to upload photo" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => doctorsService.deleteProfilePhoto(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setShowRemoveConfirm(false);
      playSuccess();
      addToast({ type: "success", title: "Photo removed" });
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to remove photo" });
    }
  });

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are accepted";
    }
    if (file.size > MAX_SIZE) {
      return "File size must be 5MB or less";
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setShakeKey((k) => k + 1);
      setTimeout(() => setError(null), 3000);
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    const start = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const progress = Math.min(90, (elapsed / 2000) * 90);
      setUploadProgress(progress);
      if (progress >= 90) clearInterval(interval);
    }, 50);
    uploadMutation.mutate(selectedFile, {
      onSettled: () => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 500);
      }
    });
  };

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {currentPhotoUrl && !preview && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-[120px] w-[120px] rounded-full overflow-hidden bg-gradient-to-br from-fcn-primary/20 to-fcn-accent/10">
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Change Photo
            </Button>
            {!showRemoveConfirm ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRemoveConfirm(true)}
              >
                <Trash2 className="h-4 w-4 text-fcn-danger" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-fcn-text-light/50">Remove?</span>
                <Button
                  size="sm"
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRemoveConfirm(false)}
                >
                  No
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {(!currentPhotoUrl || preview) && (
        <motion.div
          key={shakeKey}
          variants={!shouldReduceMotion ? shakeVariants : undefined}
          animate={error ? "shake" : undefined}
        >
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={clsx(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                dragOver
                  ? "border-fcn-accent bg-fcn-accent/5"
                  : "border-fcn-primary/20 hover:border-fcn-accent/50 hover:bg-fcn-accent/[0.02]"
              )}
            >
              <Camera className="mb-2 h-8 w-8 text-fcn-primary/40" />
              <p className="text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Drag & drop or click to upload
              </p>
              <p className="mt-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                JPEG, PNG, WebP &bull; Max 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative mx-auto h-[120px] w-[120px] rounded-full overflow-hidden bg-gradient-to-br from-fcn-primary/20 to-fcn-accent/10">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearPreview}
                  className="absolute top-1 right-1 rounded-full bg-fcn-dark/60 p-1 text-white hover:bg-fcn-dark/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  loading={isUploading}
                  onClick={handleUpload}
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                <Button size="sm" variant="ghost" onClick={clearPreview}>
                  Cancel
                </Button>
              </div>
              {(isUploading || uploadProgress > 0) && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-fcn-primary/10">
                  <motion.div
                    className="h-full rounded-full bg-fcn-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <p className="text-center text-xs text-fcn-danger">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};
