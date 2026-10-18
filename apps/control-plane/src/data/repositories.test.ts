import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "./memory-repositories";

const ore = { organizationId: "org_orebal" };
const other = { organizationId: "org_other" };

describe("tenant-scoped repositories", () => {
  it("creates stable client IDs and rejects duplicate aliases per organization", async () => {
    const repos = createMemoryRepositories();
    const first = await repos.clients.create(ore, {
      name: "Café Andino",
      aliases: ["andino"],
      entityType: "client",
      description: "Café de origen",
      language: "es",
      timezone: "America/Bogota",
    });
    const same = await repos.clients.get(ore, first.id);

    expect(same?.id).toBe(first.id);
    await expect(
      repos.clients.create(ore, {
        name: "Otro",
        aliases: ["ANDINO"],
        entityType: "client",
        description: "",
        language: "es",
        timezone: "UTC",
      }),
    ).rejects.toThrow(/alias/i);
  });

  it("does not expose one organization's clients to another", async () => {
    const repos = createMemoryRepositories();
    const client = await repos.clients.create(ore, {
      name: "Aníbal Elore",
      aliases: ["anibal"],
      entityType: "owned_brand",
      description: "Marca personal",
      language: "es",
      timezone: "America/Denver",
    });

    expect(await repos.clients.get(other, client.id)).toBeNull();
    expect(await repos.clients.list(other)).toEqual([]);
  });

  it("preserves the approved brand profile when adding a project", async () => {
    const repos = createMemoryRepositories();
    const client = await repos.clients.create(ore, {
      name: "eQatu",
      aliases: [],
      entityType: "client",
      description: "Marketplace",
      language: "es",
      timezone: "America/Denver",
    });
    const profile = await repos.brandProfiles.createVersion(ore, {
      clientId: client.id,
      voice: "clara y útil",
      offer: "comercio local",
      audiences: ["compradores locales"],
      constraints: ["no inventar cifras"],
      source: "approved_manual",
    });
    await repos.projects.create(ore, { clientId: client.id, name: "Lanzamiento", objective: "autoridad" });

    expect((await repos.brandProfiles.getCurrent(ore, client.id))?.id).toBe(profile.id);
  });

  it("rejects unscoped access and cross-client project references", async () => {
    const repos = createMemoryRepositories();
    await expect(repos.clients.list({ organizationId: "" })).rejects.toThrow(/organizationId/);
    const clientA = await repos.clients.create(ore, {
      name: "A", aliases: [], entityType: "client", description: "", language: "es", timezone: "UTC",
    });
    const clientB = await repos.clients.create(ore, {
      name: "B", aliases: [], entityType: "client", description: "", language: "es", timezone: "UTC",
    });
    const project = await repos.projects.create(ore, { clientId: clientA.id, name: "A1", objective: "ventas" });

    await expect(
      repos.tasks.create(ore, { clientId: clientB.id, projectId: project.id, kind: "campaign", input: {} }),
    ).rejects.toThrow(/cross-client/i);
  });

  it("keeps audit events append-only", async () => {
    const repos = createMemoryRepositories();
    const event = await repos.audit.append(ore, {
      actorType: "owner",
      actorId: "telegram:42",
      action: "client.created",
      targetType: "client",
      targetId: "client_1",
      metadata: { source: "telegram" },
    });

    expect(await repos.audit.list(ore)).toEqual([event]);
    expect("update" in repos.audit).toBe(false);
    expect("delete" in repos.audit).toBe(false);
  });
});
