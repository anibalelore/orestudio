import type { RuntimeConfig } from "../../../../config";
import type { QueuePort } from "../../../../queue/contracts";
import { runWorker } from "../../../../queue/worker";

export function createWorkerHandler(config: RuntimeConfig, queue: QueuePort) {
  return async (request: Request) => {
    if (request.headers.get("authorization") !== `Bearer ${config.internalWorkerSecret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
    return Response.json(await runWorker({ queue, maxJobs: config.worker.maxJobs, deadlineMs: config.worker.deadlineMs, handlers: {} }));
  };
}
export async function GET() { return Response.json({ error: "Runtime dependencies are not initialized" }, { status: 503 }); }
