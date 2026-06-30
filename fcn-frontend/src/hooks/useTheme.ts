import { useEffect } from "react";
import { useUiStore } from "@/store/ui.store";

export const useTheme = () => {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return {
    theme,
    toggleTheme,
    isDark: theme === "dark"
  };
};
