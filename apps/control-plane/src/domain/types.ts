export type Scope = { organizationId: string };
export type EntityType = "owned_brand" | "client";
export type WorkState =
  | "received" | "queued" | "running" | "saved" | "ready_for_review"
  | "delivered" | "paused" | "failed_needs_attention";

export type Client = {
  id: string; organizationId: string; name: string; aliases: string[];
  entityType: EntityType; description: string; language: string; timezone: string;
  driveFolderId: string | null; driveState: "pending" | "ready" | "failed";
  createdAt: string;
};
export type ClientInput = Omit<Client, "id" | "organizationId" | "driveFolderId" | "driveState" | "createdAt">;

export type BrandProfile = {
  id: string; organizationId: string; clientId: string; version: number;
  voice: string; offer: string; audiences: string[]; constraints: string[];
  source: "approved_manual" | "conversation"; createdAt: string;
};
export type BrandProfileInput = Omit<BrandProfile, "id" | "organizationId" | "version" | "createdAt">;

export type Project = {
  id: string; organizationId: string; clientId: string; name: string;
  objective: string; driveFolderId: string | null; state: WorkState; createdAt: string;
};
export type ProjectInput = Pick<Project, "clientId" | "name" | "objective">;

export type Task = {
  id: string; organizationId: string; clientId: string; projectId: string | null;
  kind: string; input: Record<string, unknown>; state: WorkState; idempotencyKey?: string;
  createdAt: string;
};
export type TaskInput = Pick<Task, "clientId" | "projectId" | "kind" | "input"> & { idempotencyKey?: string };

export type AuditEvent = {
  id: string; organizationId: string; actorType: string; actorId: string;
  action: string; targetType: string; targetId: string;
  metadata: Record<string, unknown>; createdAt: string;
};
export type AuditEventInput = Omit<AuditEvent, "id" | "organizationId" | "createdAt">;

export type ConversationContext = {
  id: string; organizationId: string; channel: "telegram" | "panel";
  conversationId: string; clientId: string | null; projectId: string | null; updatedAt: string;
};

export type StoredRecord = {
  id: string; organizationId: string; clientId?: string; projectId?: string | null;
  [key: string]: unknown;
};
