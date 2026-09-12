import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/Button";

interface InstallAppButtonProps {
  variant?: "primary" | "secondary" | "ghost";
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
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  if (!canInstall || isInstalled) return null;

  return (
    <Button
      variant={variant}
      size={size}
      icon={<Download className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />}
      onClick={promptInstall}
      className={fullWidth ? "w-full" : className}
    >
      Download App
    </Button>
  );
};