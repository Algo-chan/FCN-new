import { env } from "../config/env";

const flags = {
  FEATURE_PUBLIC_DOCTORS: env.FEATURE_PUBLIC_DOCTORS
} as const;

export type FeatureFlag = keyof typeof flags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return flags[flag];
}

export default flags;