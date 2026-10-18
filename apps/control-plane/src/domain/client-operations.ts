import type { Repositories } from "../data/repositories";
import type { Client, ClientInput, Project, ProjectInput, Scope } from "./types";

type OperationResult<T> = { status: "created" | "needs_selection"; entity: T; options: T[]; missing: string[] };

export async function createClient(repos: Repositories, scope: Scope, input: Omit<ClientInput, "aliases"> & { aliases?: string[] }): Promise<OperationResult<Client>> {
  const matches = await repos.clients.findByNameOrAlias(scope, input.name);
  if (matches.length) return { status: "needs_selection", entity: matches[0], options: matches, missing: [] };
  const entity = await repos.clients.create(scope, { ...input, aliases: input.aliases ?? [] });
  await repos.audit.append(scope, { actorType: "system", actorId: "client-operations", action: "client.created", targetType: "client", targetId: entity.id, metadata: {} });
  return { status: "created", entity, options: [], missing: ["driveFolderId"] };
}

export async function createProject(repos: Repositories, scope: Scope, input: ProjectInput): Promise<OperationResult<Project>> {
  const entity = await repos.projects.create(scope, input);
  await repos.audit.append(scope, { actorType: "system", actorId: "client-operations", action: "project.created", targetType: "project", targetId: entity.id, metadata: { clientId: entity.clientId } });
  return { status: "created", entity, options: [], missing: ["driveFolderId"] };
}
