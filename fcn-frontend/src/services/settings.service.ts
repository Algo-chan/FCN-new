import { api } from "@/services/api";
import type { ApiResponse, SystemSetting } from "@/types";

export const settingsService = {
  getAll: () =>
    api.get<ApiResponse<SystemSetting[]>>("/settings").then((r) => r.data),

  update: (key: string, value: string, description?: string) =>
    api.patch<ApiResponse<void>>(`/settings/${key}`, { value, description }).then((r) => r.data)
};
