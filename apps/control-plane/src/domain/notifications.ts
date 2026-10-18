import { randomUUID } from "node:crypto";
type Notification = { id: string; key: string; payload: Record<string, unknown>; delivered: boolean };
export class NotificationCenter {
  private readonly records = new Map<string, Notification>();
  notifyImmediate(key: string, payload: Record<string, unknown>) { const existing = this.records.get(key); if (existing) return { ...existing }; const record = { id: `notification_${randomUUID()}`, key, payload, delivered: false }; this.records.set(key, record); return { ...record }; }
  async deliverNotificationOnce(id: string, deliver: (payload: Record<string, unknown>) => Promise<void>) { const record = [...this.records.values()].find((item) => item.id === id); if (!record) throw new Error("Notification not found"); if (record.delivered) return false; await deliver(record.payload); record.delivered = true; return true; }
  buildDailyDigest(input: { timezone: string; completed: Array<{ title: string; url: string }>; running: string[]; blocked: string[]; decisions: string[]; costs: { observed: number; estimated: number } }) { const section = (name: string, lines: string[]) => `${name}:\n${lines.length ? lines.map((line) => `- ${line}`).join("\n") : "- Ninguno"}`; return { timezone: input.timezone, scheduledAt: null, text: [section("Terminados", input.completed.map((x) => `${x.title}: ${x.url}`)), section("En curso", input.running), section("Bloqueos", input.blocked), section("Decisiones", input.decisions), `Costos: observados ${input.costs.observed}; estimados ${input.costs.estimated}`].join("\n\n") }; }
}
