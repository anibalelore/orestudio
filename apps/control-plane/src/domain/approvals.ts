import { ActionTokenStore } from "./action-tokens";
type Approval = { ownerId: string; clientId: string; projectId: string | null; artifactVersionId: string; action: string; destination: string };
export class ApprovalGate {
  private readonly tokens = new ActionTokenStore(); private readonly approvals = new Map<string, Approval>();
  issueActionToken(input: { ownerId: string; clientId: string; projectId: string | null; artifactVersionId: string; action: string; expiresAt: number }) { return this.tokens.issue(input); }
  consumeActionToken(token: string, expected: { ownerId: string; artifactVersionId: string; now: number }) { return this.tokens.consume(token, expected); }
  approveVersion(input: Approval) { if (!input.artifactVersionId) throw new Error("Artifact version is required"); if (!input.destination) throw new Error("Approval destination is required"); const key = `${input.artifactVersionId}:${input.action}:${input.destination}`; this.approvals.set(key, input); return input; }
  requestChanges(artifactVersionId: string, instructions: string) { if (!artifactVersionId || !instructions.trim()) throw new Error("Version and change instructions are required"); return { artifactVersionId, instructions, state: "changes_requested" as const }; }
}
