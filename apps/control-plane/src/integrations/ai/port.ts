export type ModelJob = { providerJobId: string; state: "queued" | "running" | "completed" | "failed"; output?: string; observedCost?: number };
export interface AiPort { start(prompt: string, idempotencyKey: string): Promise<ModelJob>; poll(providerJobId: string): Promise<ModelJob>; }
