import { Download, RefreshCw, Check } from "lucide-react";
import { usePWAInstall, CURRENT_APP_VERSION } from "@/hooks/usePWAInstall";
import { useAppPromptStore } from "@/store/app-prompt.store";
import { Button } from "@/components/ui/Button";

interface InstallAppButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "action";
  size?: "sm" | "md";
  className?: string;
  fullWidth?: boolean;
}

export const InstallAppButton = ({
  variant = "primary",
  size = "md",
  className,
  fullWidth
}: InstallAppButtonProps) => {
  const { isDownloadedBefore, hasUpdate, isUpdating } = usePWAInstall();
  const { open } = useAppPromptStore();

  const handleClick = () => {
    open(isDownloadedBefore ? (hasUpdate ? "update" : "up-to-date") : "download");
  };

  if (!isDownloadedBefore) {
    return (
      <Button
        variant={variant}
        size={size}
        icon={<Download className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />}
        onClick={handleClick}
        className={fullWidth ? "w-full" : className}
      >
        Download App
      </Button>
    );
  }

  if (hasUpdate) {
    return (
      <Button
        variant={variant}
        size={size}
        icon={
          <span className="relative inline-flex items-center">
            <RefreshCw
              className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${
                isUpdating ? "animate-spin text-emerald-500" : ""
              }`}
            />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </span>
        }
        onClick={handleClick}
        className={fullWidth ? "w-full" : className}
      >
        Update App
      </Button>
    );
  }

  // Already downloaded and on latest version
  return (
    <Button
      variant="ghost"
      size={size}
      icon={<Check className={size === "sm" ? "h-3.5 w-3.5 text-emerald-500" : "h-4 w-4 text-emerald-500"} />}
      onClick={handleClick}
      className={fullWidth ? "w-full" : className}
      title="Fast Care Network app is up to date"
    >
      App v{CURRENT_APP_VERSION}
    </Button>
  );
};
