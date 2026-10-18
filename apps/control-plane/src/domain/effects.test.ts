import { describe, expect, it } from "vitest";
import { EffectGate } from "./effects";

describe("external effect gate", () => {
  it("rechecks global and project pause immediately before executing", async () => {
    const gate = new EffectGate(); gate.authorizeEffect({ clientId: "c", projectId: "p", action: "publish", destination: "tiktok" }); gate.pauseScope("project", "p");
    await expect(gate.executeEffectOnce({ key: "publish:v1", clientId: "c", projectId: "p", action: "publish", destination: "tiktok" }, async () => "ok")).rejects.toThrow(/paused/);
  });

  it("executes a repeated effect once and returns reconciled result", async () => {
    const gate = new EffectGate(); gate.authorizeEffect({ clientId: "c", projectId: "p", action: "publish", destination: "tiktok" }); let calls = 0;
    const effect = () => gate.executeEffectOnce({ key: "publish:v1", clientId: "c", projectId: "p", action: "publish", destination: "tiktok" }, async () => { calls++; return "external-1"; });
    expect(await effect()).toBe("external-1"); expect(await effect()).toBe("external-1"); expect(calls).toBe(1);
  });
});
