import { describe, expect, it } from "vitest";
import { createPythonAgentRunner } from "./python-runner";

describe("ORE agent runner", () => {
  it("passes scoped profile and channels through the versioned contract", async () => {
    let request = "";
    const runner = createPythonAgentRunner(async (_command, args) => { request = args.at(-1) ?? ""; return JSON.stringify({ contractVersion: 1, projectId: "p1", artifacts: [{ kind: "platform-study-tiktok", path: "study.md" }, { kind: "writer", path: "writer.md" }] }); });
    const result = await runner.executeStep({ organizationId: "org", clientId: "anibal", projectId: "p1", profileVersionId: "profile_anibal_v2", offer: "consultoría", buyer: "fundadores", channels: ["tiktok"] });
    expect(JSON.parse(request)).toMatchObject({ clientId: "anibal", profileVersionId: "profile_anibal_v2" });
    expect(result.artifacts.map((a) => a.kind)).toEqual(["platform-study-tiktok", "writer"]);
  });

  it("reports an unavailable capability instead of pretending success", async () => {
    const runner = createPythonAgentRunner(async () => { throw new Error("python unavailable"); });
    await expect(runner.executeStep({ organizationId: "o", clientId: "c", projectId: "p", profileVersionId: "v", offer: "x", buyer: "y", channels: ["linkedin"] })).rejects.toThrow(/python unavailable/);
  });
});
