import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const valid: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  OREBAL_ADAPTER_MODE: "fake",
  OREBAL_ORGANIZATION_ID: "org_orebal",
  TELEGRAM_OWNER_ID: "1234567890123",
  TELEGRAM_PRIVATE_CHAT_ID: "1234567890123",
  TELEGRAM_WEBHOOK_SECRET: "telegram_secret_1234567890",
  INTERNAL_WORKER_SECRET: "worker_secret_1234567890",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_secret",
  DRIVE_ROOT_FOLDER_ID: "drive_root_id",
};

describe("loadConfig", () => {
  it("rejects missing required settings", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/TELEGRAM_OWNER_ID/);
  });

  it("rejects non-numeric Telegram identity", () => {
    expect(() => loadConfig({ ...valid, TELEGRAM_OWNER_ID: "@anibal" })).toThrow(/TELEGRAM_OWNER_ID/);
  });

  it("rejects short webhook and worker secrets", () => {
    expect(() => loadConfig({ ...valid, TELEGRAM_WEBHOOK_SECRET: "short" })).toThrow(/TELEGRAM_WEBHOOK_SECRET/);
    expect(() => loadConfig({ ...valid, INTERNAL_WORKER_SECRET: "short" })).toThrow(/INTERNAL_WORKER_SECRET/);
  });

  it("allows local fake adapters without real provider credentials", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      OREBAL_ADAPTER_MODE: "fake",
      OREBAL_ORGANIZATION_ID: "org_local",
      TELEGRAM_OWNER_ID: "42",
      TELEGRAM_PRIVATE_CHAT_ID: "42",
      TELEGRAM_WEBHOOK_SECRET: "local_webhook_secret",
      INTERNAL_WORKER_SECRET: "local_worker_secret",
    });
    expect(config.adapterMode).toBe("fake");
    expect(config.supabase).toBeNull();
    expect(config.driveRootFolderId).toBeNull();
    expect(config.worker.maxJobs).toBe(5);
  });

  it("parses configurable execution limits", () => {
    const config = loadConfig({
      ...valid,
      WORKER_MAX_JOBS: "3",
      WORKER_DEADLINE_MS: "12000",
      TELEGRAM_MAX_FILE_BYTES: "1048576",
    });
    expect(config.worker).toEqual({ maxJobs: 3, deadlineMs: 12000 });
    expect(config.telegramMaxFileBytes).toBe(1_048_576);
  });
});
