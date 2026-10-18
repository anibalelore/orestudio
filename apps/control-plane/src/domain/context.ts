import type { Repositories } from "../data/repositories";
import type { Scope } from "./types";

type ContextRequest = { channel: "telegram" | "panel"; conversationId: string; explicitClientId?: string; explicitProjectId?: string; attachmentName?: string };

export async function resolveExplicitOrActiveContext(repos: Repositories, scope: Scope, request: ContextRequest) {
  const active = await repos.contexts.get(scope, request.channel, request.conversationId);
  const clientId = request.explicitClientId ?? active?.clientId ?? null;
  const projectId = request.explicitProjectId ?? (request.explicitClientId && request.explicitClientId !== active?.clientId ? null : active?.projectId ?? null);
  if (!clientId) throw new Error("Client context is required");
  const client = await repos.clients.get(scope, clientId);
  if (!client) throw new Error("Client context is outside the organization");
  if (projectId) {
    const project = await repos.projects.get(scope, projectId);
    if (!project || project.clientId !== clientId) throw new Error("Project context does not belong to client");
  }
  return { clientId, projectId };
}

export async function selectContext(repos: Repositories, scope: Scope, request: ContextRequest) {
  const resolved = await resolveExplicitOrActiveContext(repos, scope, request);
  return repos.contexts.set(scope, { channel: request.channel, conversationId: request.conversationId, ...resolved });
}
