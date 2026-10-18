export type AgentStepRequest = { organizationId: string; clientId: string; projectId: string; profileVersionId: string; offer: string; buyer: string; channels: string[]; tone?: string; outputRoot?: string };
export type AgentArtifact = { kind: string; path: string };
export type AgentStepResult = { contractVersion: 1; clientId?: string; projectId: string; profileVersionId?: string; artifacts: AgentArtifact[] };
export interface AgentRunner { plan(request: AgentStepRequest): Promise<{ steps: string[] }>; executeStep(request: AgentStepRequest): Promise<AgentStepResult>; }
