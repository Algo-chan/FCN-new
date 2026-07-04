import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";

export const useSystemSettings = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const response = await settingsService.getAll();
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const settings = data ?? [];

  const get = (key: string): string | undefined => {
    return settings.find((s) => s.key === key)?.value;
  };

  const isPaymentEnabled = (): boolean => {
    return get("payment_enabled") === "true";
  };

  const isFreePeriod = (): boolean => {
    const freePeriodEnds = get("free_period_ends_at");
    if (!freePeriodEnds) return false;
    return new Date() < new Date(freePeriodEnds);
  };

  return {
    settings,
    get,
    isPaymentEnabled: isPaymentEnabled(),
    isFreePeriod: isFreePeriod(),
    isLoading,
    error
  };
};
