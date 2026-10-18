import { randomUUID } from "node:crypto";
import type { Repositories, ScopedStore } from "./repositories";
import { requireScope } from "./repositories";
import type { AuditEvent, BrandProfile, Client, ConversationContext, Project, Scope, StoredRecord, Task } from "../domain/types";

type Query = PromiseLike<{ data: unknown; error: { message: string } | null }> & Record<string, (...args: unknown[]) => Query>;
type Db = { from(table: string): Query };
const check = async <T>(query: Query): Promise<T> => { const { data, error } = await query; if (error) throw new Error(error.message); return data as T; };
const one = async <T>(query: Query) => check<T>(query.select().single());

export function createSupabaseRepositories(db: Db): Repositories {
  if (!db) throw new Error("Supabase client is required");
  const generic = (table: string): ScopedStore<StoredRecord> => ({
    async put(scope, value) { requireScope(scope); return one(db.from(table).upsert({ ...value, organization_id: scope.organizationId })); },
    async get(scope, id) { requireScope(scope); return check(db.from(table).select("*").eq("organization_id", scope.organizationId).eq("id", id).maybeSingle()); },
    async list(scope) { requireScope(scope); return check(db.from(table).select("*").eq("organization_id", scope.organizationId)); },
  });
  return {
    clients: {
      async create(scope, input) { requireScope(scope); return one<Client>(db.from("clients").insert({ ...input, organization_id: scope.organizationId, normalized_name: input.name.trim().toLowerCase() })); },
      async get(scope, id) { requireScope(scope); return check<Client | null>(db.from("clients").select("*").eq("organization_id", scope.organizationId).eq("id", id).maybeSingle()); },
      async list(scope) { requireScope(scope); return check<Client[]>(db.from("clients").select("*").eq("organization_id", scope.organizationId)); },
      async findByNameOrAlias(scope, value) { requireScope(scope); return check<Client[]>(db.from("clients").select("*").eq("organization_id", scope.organizationId).or(`normalized_name.eq.${value.toLowerCase()},aliases.cs.{${value}}`)); },
    },
    brandProfiles: {
      async createVersion(scope, input) { requireScope(scope); const current = await check<BrandProfile[]>(db.from("brand_profiles").select("version").eq("organization_id", scope.organizationId).eq("client_id", input.clientId).order("version", { ascending: false }).limit(1)); return one<BrandProfile>(db.from("brand_profiles").insert({ ...input, organization_id: scope.organizationId, client_id: input.clientId, version: (current[0]?.version ?? 0) + 1 })); },
      async getCurrent(scope, clientId) { requireScope(scope); return check<BrandProfile | null>(db.from("brand_profiles").select("*").eq("organization_id", scope.organizationId).eq("client_id", clientId).order("version", { ascending: false }).limit(1).maybeSingle()); },
    },
    projects: {
      async create(scope, input) { requireScope(scope); return one<Project>(db.from("projects").insert({ organization_id: scope.organizationId, client_id: input.clientId, name: input.name, objective: input.objective })); },
      async get(scope, id) { requireScope(scope); return check<Project | null>(db.from("projects").select("*").eq("organization_id", scope.organizationId).eq("id", id).maybeSingle()); },
      async listByClient(scope, clientId) { requireScope(scope); return check<Project[]>(db.from("projects").select("*").eq("organization_id", scope.organizationId).eq("client_id", clientId)); },
    },
    contexts: {
      async get(scope, channel, conversationId) { requireScope(scope); return check<ConversationContext | null>(db.from("conversation_contexts").select("*").eq("organization_id", scope.organizationId).eq("channel", channel).eq("conversation_id", conversationId).maybeSingle()); },
      async set(scope, input) { requireScope(scope); return one<ConversationContext>(db.from("conversation_contexts").upsert({ ...input, organization_id: scope.organizationId, conversation_id: input.conversationId, client_id: input.clientId, project_id: input.projectId }, { onConflict: "organization_id,channel,conversation_id" })); },
    },
    tasks: {
      async create(scope, input) { requireScope(scope); return one<Task>(db.from("tasks").upsert({ organization_id: scope.organizationId, client_id: input.clientId, project_id: input.projectId, kind: input.kind, input: input.input, idempotency_key: input.idempotencyKey }, { onConflict: "organization_id,idempotency_key" })); },
      async get(scope, id) { requireScope(scope); return check<Task | null>(db.from("tasks").select("*").eq("organization_id", scope.organizationId).eq("id", id).maybeSingle()); },
      async list(scope) { requireScope(scope); return check<Task[]>(db.from("tasks").select("*").eq("organization_id", scope.organizationId)); },
    },
    taskSteps: generic("task_steps"), artifacts: generic("artifacts"), approvals: generic("approvals"), authorizations: generic("authorizations"), actionTokens: generic("action_tokens"), notifications: generic("notifications"), costs: generic("cost_entries"), integrations: generic("integrations"), questions: generic("questions"),
    audit: {
      async append(scope, input) { requireScope(scope); return one<AuditEvent>(db.from("audit_events").insert({ ...input, id: randomUUID(), organization_id: scope.organizationId })); },
      async list(scope) { requireScope(scope); return check<AuditEvent[]>(db.from("audit_events").select("*").eq("organization_id", scope.organizationId).order("created_at")); },
    },
  };
}
