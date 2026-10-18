export type JobState = "queued" | "running" | "delivered" | "paused" | "failed_needs_attention";
export type Job = { id: string; idempotencyKey: string; kind: string; payload: Record<string, unknown>; state: JobState; attempts: number; nextRunAt: number; leaseUntil: number | null; lastError: string | null; budgetRemaining?: number };
export type NewJob = Pick<Job, "idempotencyKey" | "kind" | "payload"> & { budgetRemaining?: number };
export interface QueuePort {
  enqueue(job: NewJob): Promise<Job>; claim(limit: number, leaseMs: number, now?: number): Promise<Job[]>;
  ack(id: string): Promise<void>; retry(id: string, error: string, now?: number): Promise<void>;
  pause(id: string, reason: string): Promise<void>; recoverExpired(now?: number): Promise<number>;
  get(id: string): Promise<Job | null>; pending(): Promise<Job[]>;
}
