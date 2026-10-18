import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "../src/data/memory-repositories";
import { createClient, createProject } from "../src/domain/client-operations";
import { ensureClientStructure, ensureProjectStructure, versionedFileName } from "../src/domain/drive-structure";
import { MemoryDrive } from "../src/integrations/drive/memory-drive";
import { MemoryQueue } from "../src/queue/memory-queue";

describe("acceptance: configurable owner pilot", () => {
  it("walks assignment, context, project, durable work and versioned Drive output", async () => {
    const scope = { organizationId: "installer_org" };
    const repos = createMemoryRepositories();
    const client = (await createClient(repos, scope, { name: "Pilot Brand", entityType: "client", description: "", language: "es", timezone: "America/Denver" })).entity;
    const profile = await repos.brandProfiles.createVersion(scope, { clientId: client.id, voice: "propia", offer: "servicio", audiences: ["buyer"], constraints: [], source: "conversation" });
    const project = (await createProject(repos, scope, { clientId: client.id, name: "Campaign", objective: "validate" })).entity;
    await repos.contexts.set(scope, { channel: "telegram", conversationId: "owner-chat", clientId: client.id, projectId: project.id });
    const task = await repos.tasks.create(scope, { clientId: client.id, projectId: project.id, kind: "campaign", input: { order: ["platform-study-tiktok", "writer"] }, idempotencyKey: "update:1" });
    expect((await repos.tasks.create(scope, { clientId: client.id, projectId: project.id, kind: "campaign", input: {}, idempotencyKey: "update:1" })).id).toBe(task.id);

    const drive = new MemoryDrive();
    const clientFolders = await ensureClientStructure(drive, "root", client.id, client.name);
    const projectFolders = await ensureProjectStructure(drive, clientFolders.children["03_Proyectos"], project.id, project.name);
    expect(projectFolders.children["01_Investigacion"]).toBeTruthy();
    expect(versionedFileName(new Date("2026-10-18T00:00:00Z"), "Campaign", "script", "tiktok", 1)).toContain("_v001");
    expect(profile.clientId).toBe(client.id);

    const queue = new MemoryQueue();
    const job = await queue.enqueue({ idempotencyKey: "task:1", kind: "agent", payload: { taskId: task.id } });
    expect((await queue.claim(1, 10, 0))[0].id).toBe(job.id);
    await queue.ack(job.id);
    expect((await queue.get(job.id))?.state).toBe("delivered");
  });
});
