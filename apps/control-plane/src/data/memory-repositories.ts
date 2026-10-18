import { randomUUID } from "node:crypto";
import type {
  AuditEvent, BrandProfile, Client, ConversationContext, Project, Scope, StoredRecord, Task,
} from "../domain/types";
import type { Repositories, ScopedStore } from "./repositories";
import { requireScope } from "./repositories";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const normalized = (value: string) => value.trim().toLocaleLowerCase("es");

function genericStore<T extends StoredRecord>(): ScopedStore<T> {
  const rows = new Map<string, T>();
  return {
    async put(scope, value) {
      requireScope(scope);
      const row = { ...value, organizationId: scope.organizationId } as T;
      rows.set(row.id, structuredClone(row));
      return structuredClone(row);
    },
    async get(scope, recordId) {
      requireScope(scope);
      const row = rows.get(recordId);
      return row?.organizationId === scope.organizationId ? structuredClone(row) : null;
    },
    async list(scope) {
      requireScope(scope);
      return [...rows.values()].filter((row) => row.organizationId === scope.organizationId).map((row) => structuredClone(row));
    },
  };
}

export function createMemoryRepositories(): Repositories {
  const clients = new Map<string, Client>();
  const profiles: BrandProfile[] = [];
  const projects = new Map<string, Project>();
  const tasks = new Map<string, Task>();
  const contexts = new Map<string, ConversationContext>();
  const audits: AuditEvent[] = [];

  const clientFor = (scope: Scope, clientId: string) => {
    const client = clients.get(clientId);
    return client?.organizationId === scope.organizationId ? client : null;
  };

  return {
    clients: {
      async create(scope, input) {
        requireScope(scope);
        const proposed = new Set([input.name, ...input.aliases].map(normalized));
        const conflict = [...clients.values()].find((client) =>
          client.organizationId === scope.organizationId &&
          [client.name, ...client.aliases].map(normalized).some((name) => proposed.has(name)),
        );
        if (conflict) throw new Error(`Client name or alias already exists: ${conflict.name}`);
        const row: Client = { ...input, id: id("client"), organizationId: scope.organizationId,
          driveFolderId: null, driveState: "pending", createdAt: now() };
        clients.set(row.id, row);
        return structuredClone(row);
      },
      async get(scope, clientId) { requireScope(scope); return structuredClone(clientFor(scope, clientId)); },
      async list(scope) { requireScope(scope); return [...clients.values()].filter((c) => c.organizationId === scope.organizationId).map((row) => structuredClone(row)); },
      async findByNameOrAlias(scope, value) {
        requireScope(scope); const needle = normalized(value);
        return [...clients.values()].filter((c) => c.organizationId === scope.organizationId &&
          [c.name, ...c.aliases].some((name) => normalized(name) === needle)).map((row) => structuredClone(row));
      },
    },
    brandProfiles: {
      async createVersion(scope, input) {
        requireScope(scope);
        if (!clientFor(scope, input.clientId)) throw new Error("Client not found in organization");
        const version = profiles.filter((p) => p.organizationId === scope.organizationId && p.clientId === input.clientId).length + 1;
        const row: BrandProfile = { ...input, id: id("profile"), organizationId: scope.organizationId, version, createdAt: now() };
        profiles.push(row); return structuredClone(row);
      },
      async getCurrent(scope, clientId) {
        requireScope(scope);
        return structuredClone(profiles.filter((p) => p.organizationId === scope.organizationId && p.clientId === clientId).at(-1) ?? null);
      },
    },
    projects: {
      async create(scope, input) {
        requireScope(scope);
        if (!clientFor(scope, input.clientId)) throw new Error("Client not found in organization");
        const row: Project = { ...input, id: id("project"), organizationId: scope.organizationId,
          driveFolderId: null, state: "received", createdAt: now() };
        projects.set(row.id, row); return structuredClone(row);
      },
      async get(scope, projectId) { requireScope(scope); const row = projects.get(projectId); return row?.organizationId === scope.organizationId ? structuredClone(row) : null; },
      async listByClient(scope, clientId) { requireScope(scope); return [...projects.values()].filter((p) => p.organizationId === scope.organizationId && p.clientId === clientId).map((row) => structuredClone(row)); },
    },
    contexts: {
      async get(scope, channel, conversationId) { requireScope(scope); return structuredClone(contexts.get(`${scope.organizationId}:${channel}:${conversationId}`) ?? null); },
      async set(scope, input) {
        requireScope(scope);
        if (input.clientId && !clientFor(scope, input.clientId)) throw new Error("Client not found in organization");
        if (input.projectId) {
          const project = projects.get(input.projectId);
          if (!project || project.organizationId !== scope.organizationId || project.clientId !== input.clientId) throw new Error("cross-client context reference");
        }
        const key = `${scope.organizationId}:${input.channel}:${input.conversationId}`;
        const row: ConversationContext = { ...input, id: contexts.get(key)?.id ?? id("context"), organizationId: scope.organizationId, updatedAt: now() };
        contexts.set(key, row); return structuredClone(row);
      },
    },
    tasks: {
      async create(scope, input) {
        requireScope(scope);
        if (!clientFor(scope, input.clientId)) throw new Error("Client not found in organization");
        if (input.projectId) {
          const project = projects.get(input.projectId);
          if (!project || project.organizationId !== scope.organizationId || project.clientId !== input.clientId) throw new Error("cross-client project reference");
        }
        if (input.idempotencyKey) {
          const existing = [...tasks.values()].find((task) => task.organizationId === scope.organizationId && task.idempotencyKey === input.idempotencyKey);
          if (existing) return structuredClone(existing);
        }
        const row: Task = { ...input, id: id("task"), organizationId: scope.organizationId, state: "received", createdAt: now() };
        tasks.set(row.id, row); return structuredClone(row);
      },
      async get(scope, taskId) { requireScope(scope); const row = tasks.get(taskId); return row?.organizationId === scope.organizationId ? structuredClone(row) : null; },
      async list(scope) { requireScope(scope); return [...tasks.values()].filter((t) => t.organizationId === scope.organizationId).map((row) => structuredClone(row)); },
    },
    taskSteps: genericStore(), artifacts: genericStore(), approvals: genericStore(),
    authorizations: genericStore(), actionTokens: genericStore(), notifications: genericStore(),
    costs: genericStore(), integrations: genericStore(), questions: genericStore(),
    audit: {
      async append(scope, input) { requireScope(scope); const row: AuditEvent = { ...input, id: id("audit"), organizationId: scope.organizationId, createdAt: now() }; audits.push(row); return structuredClone(row); },
      async list(scope) { requireScope(scope); return audits.filter((event) => event.organizationId === scope.organizationId).map((row) => structuredClone(row)); },
    },
  };
}
