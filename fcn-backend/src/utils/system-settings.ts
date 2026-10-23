import { redis } from "../config/redis";
import { prisma } from "../config/database";

const CACHE_TTL = 300;

class SystemSettingsService {
  private cache = new Map<string, { value: string; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const cachedVal = await (redis as any).get(`settings:${key}`);
      if (cachedVal !== null && cachedVal !== undefined) {
        this.cache.set(key, { value: cachedVal, expiry: Date.now() + CACHE_TTL * 1000 });
        return cachedVal;
      }
    } catch {
      /* fall through to DB */
    }

    const setting = await prisma.systemSettings.findUnique({ where: { key } });
    if (!setting) return null;

    const value = setting.value;
    this.cache.set(key, { value, expiry: Date.now() + CACHE_TTL * 1000 });

    try {
      await (redis as any).set(`settings:${key}`, value, "EX", CACHE_TTL);
    } catch {
      /* ignore cache write error */
    }

    return value;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    await prisma.systemSettings.upsert({
      where: { key },
      create: { key, value, description: description ?? null },
      update: { value, description: description ?? undefined }
    });

    this.cache.delete(key);
    try {
      await (redis as any).del(`settings:${key}`);
    } catch {
      /* ignore */
    }
  }

  async getAll(): Promise<Array<{ key: string; value: string; description: string | null }>> {
    const settings = await prisma.systemSettings.findMany({ orderBy: { key: "asc" } });
    return settings.map((s) => ({ key: s.key, value: s.value, description: s.description }));
  }

  async isPaymentEnabled(): Promise<boolean> {
    const val = await this.get("payment_enabled");
    return val === "true";
  }

  async isFreePeriod(): Promise<boolean> {
    const freePeriodEnds = await this.get("free_period_ends_at");
    if (!freePeriodEnds) return false;
    return new Date() < new Date(freePeriodEnds);
  }

  invalidateCache(key: string): void {
    this.cache.delete(key);
  }
}

export const systemSettings = new SystemSettingsService();
