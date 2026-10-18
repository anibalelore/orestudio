import type {
  AuditEvent, AuditEventInput, BrandProfile, BrandProfileInput, Client, ClientInput,
  ConversationContext, Project, ProjectInput, Scope, StoredRecord, Task, TaskInput,
} from "../domain/types";

export type ScopedStore<T extends StoredRecord> = {
  put(scope: Scope, value: Omit<T, "organizationId">): Promise<T>;
  get(scope: Scope, id: string): Promise<T | null>;
  list(scope: Scope): Promise<T[]>;
};

export type Repositories = {
  clients: {
    create(scope: Scope, input: ClientInput): Promise<Client>;
    get(scope: Scope, id: string): Promise<Client | null>;
    list(scope: Scope): Promise<Client[]>;
    findByNameOrAlias(scope: Scope, value: string): Promise<Client[]>;
  };
  brandProfiles: {
    createVersion(scope: Scope, input: BrandProfileInput): Promise<BrandProfile>;
    getCurrent(scope: Scope, clientId: string): Promise<BrandProfile | null>;
  };
  projects: {
    create(scope: Scope, input: ProjectInput): Promise<Project>;
    get(scope: Scope, id: string): Promise<Project | null>;
    listByClient(scope: Scope, clientId: string): Promise<Project[]>;
  };
  contexts: {
    get(scope: Scope, channel: ConversationContext["channel"], conversationId: string): Promise<ConversationContext | null>;
    set(scope: Scope, input: Omit<ConversationContext, "id" | "organizationId" | "updatedAt">): Promise<ConversationContext>;
  };
  tasks: {
    create(scope: Scope, input: TaskInput): Promise<Task>;
    get(scope: Scope, id: string): Promise<Task | null>;
    list(scope: Scope): Promise<Task[]>;
  };
  taskSteps: ScopedStore<StoredRecord>;
  artifacts: ScopedStore<StoredRecord>;
  approvals: ScopedStore<StoredRecord>;
  authorizations: ScopedStore<StoredRecord>;
  actionTokens: ScopedStore<StoredRecord>;
  notifications: ScopedStore<StoredRecord>;
  costs: ScopedStore<StoredRecord>;
  integrations: ScopedStore<StoredRecord>;
  questions: ScopedStore<StoredRecord>;
  audit: {
    append(scope: Scope, input: AuditEventInput): Promise<AuditEvent>;
    list(scope: Scope): Promise<AuditEvent[]>;
  };
};

export function requireScope(scope: Scope): void {
  if (!scope.organizationId?.trim()) throw new Error("organizationId is required");
}
