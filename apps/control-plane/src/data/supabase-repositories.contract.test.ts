import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "./memory-repositories";
import { createSupabaseRepositories } from "./supabase-repositories";
import { SupabaseQueue } from "../queue/supabase-queue";

describe("Supabase contracts", () => {
  it("keeps the memory contract available for local execution", async () => {
    const repos = createMemoryRepositories();
    expect(await repos.clients.list({ organizationId: "local" })).toEqual([]);
  });

  it("requires a Supabase client for the real repository", () => {
    expect(() => createSupabaseRepositories(null as never)).toThrow(/Supabase client/);
  });

  it("maps durable queue operations to protected RPCs", async () => {
    const calls: string[] = [];
    const client = { rpc: async (name: string) => { calls.push(name); return { data: [], error: null }; } };
    const queue = new SupabaseQueue(client as never);
    await queue.claim(2, 1000, 10);
    await queue.recoverExpired(20);
    expect(calls).toEqual(["ore_claim_jobs", "ore_recover_expired_jobs"]);
  });
});
