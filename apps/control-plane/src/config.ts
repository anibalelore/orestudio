import { z } from "zod";

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    OREBAL_ADAPTER_MODE: z.enum(["fake", "real"]).default("fake"),
    OREBAL_ORGANIZATION_ID: z.string().min(1),
    TELEGRAM_OWNER_ID: z.string().regex(/^\d+$/, "TELEGRAM_OWNER_ID must be numeric"),
    TELEGRAM_PRIVATE_CHAT_ID: z.string().regex(/^-?\d+$/, "TELEGRAM_PRIVATE_CHAT_ID must be numeric"),
    TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
    INTERNAL_WORKER_SECRET: z.string().min(16),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    DRIVE_ROOT_FOLDER_ID: z.string().min(1).optional(),
    WORKER_MAX_JOBS: positiveInt(5),
    WORKER_DEADLINE_MS: positiveInt(20_000),
    TELEGRAM_MAX_FILE_BYTES: positiveInt(20 * 1024 * 1024),
  })
  .superRefine((value, context) => {
    if (value.OREBAL_ADAPTER_MODE !== "real") return;
    if (!value.SUPABASE_URL) {
      context.addIssue({ code: "custom", path: ["SUPABASE_URL"], message: "required for real adapters" });
    }
    if (!value.SUPABASE_SERVICE_ROLE_KEY) {
      context.addIssue({ code: "custom", path: ["SUPABASE_SERVICE_ROLE_KEY"], message: "required for real adapters" });
    }
    if (!value.DRIVE_ROOT_FOLDER_ID) {
      context.addIssue({ code: "custom", path: ["DRIVE_ROOT_FOLDER_ID"], message: "required for real adapters" });
    }
  });

export type RuntimeConfig = {
  nodeEnv: "development" | "test" | "production";
  adapterMode: "fake" | "real";
  organizationId: string;
  telegramOwnerId: string;
  telegramPrivateChatId: string;
  telegramWebhookSecret: string;
  internalWorkerSecret: string;
  supabase: { url: string; serviceRoleKey: string } | null;
  driveRootFolderId: string | null;
  worker: { maxJobs: number; deadlineMs: number };
  telegramMaxFileBytes: number;
};

export function loadConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const value = schema.parse(env);
  return {
    nodeEnv: value.NODE_ENV,
    adapterMode: value.OREBAL_ADAPTER_MODE,
    organizationId: value.OREBAL_ORGANIZATION_ID,
    telegramOwnerId: value.TELEGRAM_OWNER_ID,
    telegramPrivateChatId: value.TELEGRAM_PRIVATE_CHAT_ID,
    telegramWebhookSecret: value.TELEGRAM_WEBHOOK_SECRET,
    internalWorkerSecret: value.INTERNAL_WORKER_SECRET,
    supabase:
      value.SUPABASE_URL && value.SUPABASE_SERVICE_ROLE_KEY
        ? { url: value.SUPABASE_URL, serviceRoleKey: value.SUPABASE_SERVICE_ROLE_KEY }
        : null,
    driveRootFolderId: value.DRIVE_ROOT_FOLDER_ID ?? null,
    worker: { maxJobs: value.WORKER_MAX_JOBS, deadlineMs: value.WORKER_DEADLINE_MS },
    telegramMaxFileBytes: value.TELEGRAM_MAX_FILE_BYTES,
  };
}
