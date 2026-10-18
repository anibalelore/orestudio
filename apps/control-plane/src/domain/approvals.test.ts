import { describe, expect, it } from "vitest";
import { ApprovalGate } from "./approvals";

describe("approval gates", () => {
  it("rejects expired, repeated, foreign and stale-version tokens", () => {
    const gate = new ApprovalGate();
    const token = gate.issueActionToken({ ownerId: "42", clientId: "c", projectId: "p", artifactVersionId: "v1", action: "approve", expiresAt: 100 });
    expect(() => gate.consumeActionToken(token, { ownerId: "7", artifactVersionId: "v1", now: 50 })).toThrow(/owner/);
    expect(() => gate.consumeActionToken(token, { ownerId: "42", artifactVersionId: "v2", now: 50 })).toThrow(/version/);
    expect(gate.consumeActionToken(token, { ownerId: "42", artifactVersionId: "v1", now: 50 }).action).toBe("approve");
    expect(() => gate.consumeActionToken(token, { ownerId: "42", artifactVersionId: "v1", now: 60 })).toThrow(/consumed/);
    const expired = gate.issueActionToken({ ownerId: "42", clientId: "c", projectId: "p", artifactVersionId: "v1", action: "approve", expiresAt: 5 });
    expect(() => gate.consumeActionToken(expired, { ownerId: "42", artifactVersionId: "v1", now: 6 })).toThrow(/expired/);
  });

  it("requires unambiguous artifact/version/destination approvals", () => {
    const gate = new ApprovalGate();
    expect(() => gate.approveVersion({ ownerId: "42", clientId: "c", projectId: "p", artifactVersionId: "", action: "publish", destination: "tiktok" })).toThrow(/version/);
  });
});
