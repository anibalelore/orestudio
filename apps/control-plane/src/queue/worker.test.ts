import { describe, expect, it } from "vitest";
import { MemoryQueue } from "./memory-queue";
import { runWorker } from "./worker";

describe("durable worker", () => {
  it("deduplicates jobs and honors maxJobs", async () => {
    const queue = new MemoryQueue();
    await queue.enqueue({ idempotencyKey: "same", kind: "ok", payload: {} });
    await queue.enqueue({ idempotencyKey: "same", kind: "ok", payload: {} });
    await queue.enqueue({ idempotencyKey: "other", kind: "ok", payload: {} });
    const seen: string[] = [];
    const result = await runWorker({ queue, maxJobs: 1, deadlineMs: 1000, handlers: { ok: async (job) => { seen.push(job.id); } } });
    expect(result.completed).toBe(1); expect(seen).toHaveLength(1); expect(await queue.pending()).toHaveLength(1);
  });

  it("recovers expired leases and applies backoff until terminal failure", async () => {
    const queue = new MemoryQueue({ maxAttempts: 2, baseBackoffMs: 10 });
    const job = await queue.enqueue({ idempotencyKey: "retry", kind: "fail", payload: {} });
    await queue.claim(1, 1, 0); await queue.recoverExpired(2);
    expect((await queue.get(job.id))?.state).toBe("queued");
    await runWorker({ queue, maxJobs: 1, deadlineMs: 100, now: 20, handlers: { fail: async () => { throw new Error("boom"); } } });
    await runWorker({ queue, maxJobs: 1, deadlineMs: 100, now: 40, handlers: { fail: async () => { throw new Error("boom"); } } });
    expect((await queue.get(job.id))?.state).toBe("failed_needs_attention");
  });

  it("pauses only a job whose budget is exhausted", async () => {
    const queue = new MemoryQueue();
    const blocked = await queue.enqueue({ idempotencyKey: "budget", kind: "paid", payload: {}, budgetRemaining: 0 });
    const allowed = await queue.enqueue({ idempotencyKey: "free", kind: "free", payload: {} });
    const result = await runWorker({ queue, maxJobs: 2, deadlineMs: 1000, handlers: { paid: async () => {}, free: async () => {} } });
    expect((await queue.get(blocked.id))?.state).toBe("paused");
    expect((await queue.get(allowed.id))?.state).toBe("delivered");
    expect(result.notifications).toContain(`budget_exhausted:${blocked.id}`);
  });
});
