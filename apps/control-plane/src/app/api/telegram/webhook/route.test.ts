import { describe, expect, it } from "vitest";
import { createWebhookHandler } from "./route";
import { createMemoryRepositories } from "../../../../data/memory-repositories";
import type { RuntimeConfig } from "../../../../config";

const config = { organizationId: "org", telegramWebhookSecret: "secret", telegramOwnerId: "42", telegramPrivateChatId: "42" } as RuntimeConfig;
const body = { update_id: 99, message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: "private" }, text: "prepara los guiones" } };

describe("Telegram webhook", () => {
  it("deduplicates repeated updates into one logical task", async () => {
    const repos = createMemoryRepositories();
    const client = await repos.clients.create({ organizationId: "org" }, { name: "Aníbal", aliases: [], entityType: "owned_brand", description: "", language: "es", timezone: "America/Denver" });
    await repos.contexts.set({ organizationId: "org" }, { channel: "telegram", conversationId: "42", clientId: client.id, projectId: null });
    const handler = createWebhookHandler({ config, repos });
    const request = () => new Request("https://ore.test/api/telegram/webhook", { method: "POST", headers: { "x-telegram-bot-api-secret-token": "secret" }, body: JSON.stringify(body) });

    const first = await handler(request());
    const second = await handler(request());
    expect(first.status).toBe(202);
    expect(second.status).toBe(200);
    expect((await repos.tasks.list({ organizationId: "org" }))).toHaveLength(1);
    expect(await first.json()).toMatchObject({ status: "queued", clientId: client.id });
  });
});
