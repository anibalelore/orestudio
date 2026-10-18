import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "../src/data/memory-repositories";
import { createClient, createProject } from "../src/domain/client-operations";
import { EffectGate } from "../src/domain/effects";
import { MemoryQueue } from "../src/queue/memory-queue";

describe("acceptance: tenant and client isolation", () => {
  it("keeps a second client dormant and enforces recovery, pause and authorization", async () => {
    const repos = createMemoryRepositories();
    const scope = { organizationId: "installer_org" };
    const first = (await createClient(repos, scope, { name: "Pilot Brand", entityType: "client", description: "", language: "es", timezone: "UTC" })).entity;
    const second = (await createClient(repos, scope, { name: "Second Brand", entityType: "client", description: "", language: "es", timezone: "UTC" })).entity;
    await createProject(repos, scope, { clientId: first.id, name: "Active", objective: "run" });
    expect(await repos.projects.listByClient(scope, second.id)).toHaveLength(0);
    expect(await repos.clients.get({ organizationId: "another_install" }, second.id)).toBeNull();

    const queue = new MemoryQueue({ maxAttempts: 2, baseBackoffMs: 1 });
    const job = await queue.enqueue({ idempotencyKey: "recover", kind: "agent", payload: {}, budgetRemaining: 10 });
    await queue.claim(1, 5, 0);
    expect(await queue.recoverExpired(6)).toBe(1);
    await queue.claim(1, 5, 6);
    await queue.retry(job.id, "provider error", 7);
    expect((await queue.get(job.id))?.state).toBe("failed_needs_attention");

    const effects = new EffectGate();
    effects.authorizeEffect({ clientId: first.id, projectId: null, action: "publish", destination: "tiktok" });
    effects.pauseScope("global");
    await expect(effects.executeEffectOnce({ key: "effect:1", clientId: first.id, projectId: null, action: "publish", destination: "tiktok" }, async () => "sent")).rejects.toThrow(/paused/);
  });
});
