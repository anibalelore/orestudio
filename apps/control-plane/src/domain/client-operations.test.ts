import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "../data/memory-repositories";
import { createClient, createProject } from "./client-operations";
import { resolveExplicitOrActiveContext } from "./context";

const scope = { organizationId: "org" };

describe("client operations", () => {
  it("creates a minimal client pending Drive instead of inventing a brief", async () => {
    const repos = createMemoryRepositories();
    const result = await createClient(repos, scope, { name: "Café Andino", entityType: "client", description: "", language: "es", timezone: "America/Denver" });
    expect(result.entity.driveState).toBe("pending");
    expect(result.missing).toContain("driveFolderId");
  });

  it("returns duplicate options without creating another client", async () => {
    const repos = createMemoryRepositories();
    await createClient(repos, scope, { name: "eQatu", entityType: "client", description: "", language: "es", timezone: "UTC" });
    const result = await createClient(repos, scope, { name: "EQATU", entityType: "client", description: "", language: "es", timezone: "UTC" });
    expect(result.status).toBe("needs_selection");
    expect(await repos.clients.list(scope)).toHaveLength(1);
  });

  it("adds a project without replacing the current brand profile", async () => {
    const repos = createMemoryRepositories();
    const client = (await createClient(repos, scope, { name: "eQatu", entityType: "client", description: "", language: "es", timezone: "UTC" })).entity;
    const profile = await repos.brandProfiles.createVersion(scope, { clientId: client.id, voice: "oficial", offer: "mercado", audiences: [], constraints: [], source: "approved_manual" });
    await createProject(repos, scope, { clientId: client.id, name: "Piloto", objective: "validar" });
    expect((await repos.brandProfiles.getCurrent(scope, client.id))?.id).toBe(profile.id);
  });

  it("prefers explicit context and never resolves from an attachment filename", async () => {
    const repos = createMemoryRepositories();
    const a = (await createClient(repos, scope, { name: "A", entityType: "client", description: "", language: "es", timezone: "UTC" })).entity;
    const b = (await createClient(repos, scope, { name: "B", entityType: "client", description: "", language: "es", timezone: "UTC" })).entity;
    await repos.contexts.set(scope, { channel: "telegram", conversationId: "42", clientId: a.id, projectId: null });
    expect((await resolveExplicitOrActiveContext(repos, scope, { channel: "telegram", conversationId: "42", explicitClientId: b.id, attachmentName: "A.pdf" })).clientId).toBe(b.id);
  });
});
