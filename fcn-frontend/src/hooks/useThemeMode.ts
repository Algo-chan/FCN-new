import { useCallback } from "react";
import { useUiStore } from "@/store/ui.store";

export const useThemeMode = () => {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  const setTheme = useCallback(
    (newTheme: "dark" | "light") => {
      const current = useUiStore.getState().theme;
      if (newTheme !== current) {
        useUiStore.getState().toggleTheme();
      }
    },
    []
  );

  return { theme, isDark, toggleTheme, setTheme };
};
