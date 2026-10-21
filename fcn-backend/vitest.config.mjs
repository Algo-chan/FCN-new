import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/fcn_test?schema=public",
      DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/fcn_test?schema=public",
      JWT_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      JWT_REFRESH_SECRET: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
      JWT_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "7d",
      REDIS_URL: "redis://localhost:6379",
      ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      FRONTEND_URL: "http://localhost:3000",
      BACKEND_URL: "http://localhost:5000",
      CORS_ORIGINS: "http://localhost:3000",
      SESSION_SECRET: "super_secret_session_key_min_32_characters_long",
      FEATURE_PUBLIC_DOCTORS: "true"
    }
  }
});
