import { randomUUID } from "node:crypto";
import type { Job, NewJob, QueuePort } from "./contracts";

export class MemoryQueue implements QueuePort {
  private readonly jobs = new Map<string, Job>();
  constructor(private readonly options = { maxAttempts: 3, baseBackoffMs: 1000 }) {}
  async enqueue(input: NewJob) { const duplicate = [...this.jobs.values()].find((j) => j.idempotencyKey === input.idempotencyKey); if (duplicate) return structuredClone(duplicate); const job: Job = { ...input, id: `job_${randomUUID()}`, state: "queued", attempts: 0, nextRunAt: 0, leaseUntil: null, lastError: null }; this.jobs.set(job.id, job); return structuredClone(job); }
  async claim(limit: number, leaseMs: number, now = Date.now()) { const selected = [...this.jobs.values()].filter((j) => j.state === "queued" && j.nextRunAt <= now).slice(0, limit); for (const job of selected) { job.state = "running"; job.attempts += 1; job.leaseUntil = now + leaseMs; } return selected.map((j) => structuredClone(j)); }
  async ack(id: string) { const job = this.must(id); job.state = "delivered"; job.leaseUntil = null; }
  async retry(id: string, error: string, now = Date.now()) { const job = this.must(id); job.lastError = error; job.leaseUntil = null; if (job.attempts >= this.options.maxAttempts) job.state = "failed_needs_attention"; else { job.state = "queued"; job.nextRunAt = now + this.options.baseBackoffMs * 2 ** (job.attempts - 1); } }
  async pause(id: string, reason: string) { const job = this.must(id); job.state = "paused"; job.lastError = reason; job.leaseUntil = null; }
  async recoverExpired(now = Date.now()) { let count = 0; for (const job of this.jobs.values()) if (job.state === "running" && (job.leaseUntil ?? Infinity) <= now) { job.state = "queued"; job.leaseUntil = null; count++; } return count; }
  async get(id: string) { const job = this.jobs.get(id); return job ? structuredClone(job) : null; }
  async pending() { return [...this.jobs.values()].filter((j) => j.state === "queued" || j.state === "running").map((j) => structuredClone(j)); }
  private must(id: string) { const job = this.jobs.get(id); if (!job) throw new Error(`Job not found: ${id}`); return job; }
}
