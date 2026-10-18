import type { Job, QueuePort } from "./contracts";
type Handler = (job: Job) => Promise<void>;

export async function runWorker(options: { queue: QueuePort; maxJobs: number; deadlineMs: number; handlers: Record<string, Handler>; now?: number }) {
  const started = options.now ?? Date.now(); const notifications: string[] = []; let completed = 0; let failed = 0;
  await options.queue.recoverExpired(started);
  const jobs = await options.queue.claim(options.maxJobs, Math.max(options.deadlineMs, 1), started);
  for (const job of jobs) {
    if ((options.now ?? Date.now()) - started >= options.deadlineMs) break;
    if (job.budgetRemaining !== undefined && job.budgetRemaining <= 0) { await options.queue.pause(job.id, "budget exhausted"); notifications.push(`budget_exhausted:${job.id}`); continue; }
    try { const handler = options.handlers[job.kind]; if (!handler) throw new Error(`No handler: ${job.kind}`); await handler(job); await options.queue.ack(job.id); completed++; }
    catch (error) { await options.queue.retry(job.id, error instanceof Error ? error.message : String(error), options.now ?? Date.now()); failed++; }
  }
  return { claimed: jobs.length, completed, failed, notifications };
}
