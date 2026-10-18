import type { Job, NewJob, QueuePort } from "./contracts";

type RpcClient = { rpc(name: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> };
const rows = (data: unknown): Job[] => Array.isArray(data) ? data as Job[] : [];
export class SupabaseQueue implements QueuePort {
  constructor(private readonly client: RpcClient) { if (!client) throw new Error("Supabase client is required"); }
  private async rpc(name: string, args: Record<string, unknown> = {}) { const { data, error } = await this.client.rpc(name, args); if (error) throw new Error(error.message); return data; }
  async enqueue(job: NewJob) { return (await this.rpc("ore_enqueue_job", { job })) as Job; }
  async claim(limit: number, leaseMs: number, now = Date.now()) { return rows(await this.rpc("ore_claim_jobs", { max_jobs: limit, lease_ms: leaseMs, now_ms: now })); }
  async ack(id: string) { await this.rpc("ore_ack_job", { job_id: id }); }
  async retry(id: string, error: string, now = Date.now()) { await this.rpc("ore_retry_job", { job_id: id, error_text: error, now_ms: now }); }
  async pause(id: string, reason: string) { await this.rpc("ore_pause_job", { job_id: id, reason }); }
  async recoverExpired(now = Date.now()) { return Number(await this.rpc("ore_recover_expired_jobs", { now_ms: now })) || 0; }
  async get(id: string) { return (await this.rpc("ore_get_job", { job_id: id })) as Job | null; }
  async pending() { return rows(await this.rpc("ore_pending_jobs")); }
}
