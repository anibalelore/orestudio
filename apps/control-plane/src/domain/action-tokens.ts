import { randomBytes } from "node:crypto";
export type ActionTokenRecord = { ownerId: string; clientId: string; projectId: string | null; artifactVersionId: string; action: string; expiresAt: number; consumedAt: number | null };
export class ActionTokenStore {
  private readonly records = new Map<string, ActionTokenRecord>();
  issue(record: Omit<ActionTokenRecord, "consumedAt">) { const token = randomBytes(24).toString("base64url"); this.records.set(token, { ...record, consumedAt: null }); return token; }
  consume(token: string, expected: { ownerId: string; artifactVersionId: string; now: number }) { const record = this.records.get(token); if (!record) throw new Error("Unknown action token"); if (record.ownerId !== expected.ownerId) throw new Error("Action token belongs to another owner"); if (record.artifactVersionId !== expected.artifactVersionId) throw new Error("Action token belongs to another version"); if (record.expiresAt < expected.now) throw new Error("Action token expired"); if (record.consumedAt !== null) throw new Error("Action token already consumed"); record.consumedAt = expected.now; return { ...record }; }
}
