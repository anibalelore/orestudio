import { describe, expect, it } from "vitest";
import { NotificationCenter } from "./notifications";

describe("notifications", () => {
  it("deduplicates immediate alerts and deliveries", async () => {
    const center = new NotificationCenter();
    const first = center.notifyImmediate("terminal:task1", { kind: "terminal_failure", taskId: "task1" });
    const repeated = center.notifyImmediate("terminal:task1", { kind: "terminal_failure", taskId: "task1" });
    let calls = 0; await center.deliverNotificationOnce(first.id, async () => { calls++; }); await center.deliverNotificationOnce(repeated.id, async () => { calls++; });
    expect(first.id).toBe(repeated.id); expect(calls).toBe(1);
  });

  it("groups routine progress without inventing a delivery time", () => {
    const center = new NotificationCenter();
    const digest = center.buildDailyDigest({ timezone: "America/Denver", completed: [{ title: "Guion", url: "https://drive/1" }], running: ["Investigación"], blocked: ["Falta API"], decisions: ["Aprobar v2"], costs: { observed: 2, estimated: 1 } });
    expect(digest.timezone).toBe("America/Denver"); expect(digest.scheduledAt).toBeNull(); expect(digest.text).toContain("https://drive/1");
  });
});
