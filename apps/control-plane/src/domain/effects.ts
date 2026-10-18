type Authorization = { clientId: string; projectId: string | null; action: string; destination: string; expiresAt?: number };
type Effect = Authorization & { key: string };
export class EffectGate {
  private globalPaused = false; private readonly pausedProjects = new Set<string>(); private readonly authorizations: Authorization[] = []; private readonly results = new Map<string, unknown>();
  authorizeEffect(auth: Authorization) { this.authorizations.push(auth); }
  pauseScope(scope: "global" | "project", id?: string) { if (scope === "global") this.globalPaused = true; else if (id) this.pausedProjects.add(id); }
  resumeScope(scope: "global" | "project", id?: string) { if (scope === "global") this.globalPaused = false; else if (id) this.pausedProjects.delete(id); }
  async executeEffectOnce<T>(effect: Effect, run: () => Promise<T>, now = Date.now()): Promise<T> {
    if (this.results.has(effect.key)) return this.results.get(effect.key) as T;
    if (this.globalPaused || (effect.projectId && this.pausedProjects.has(effect.projectId))) throw new Error("Scope is paused");
    const allowed = this.authorizations.some((auth) => auth.clientId === effect.clientId && auth.projectId === effect.projectId && auth.action === effect.action && auth.destination === effect.destination && (!auth.expiresAt || auth.expiresAt >= now));
    if (!allowed) throw new Error("External effect is not authorized");
    const result = await run(); this.results.set(effect.key, result); return result;
  }
}
