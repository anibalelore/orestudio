import type { RuntimeConfig } from "../../../../config";
import type { Repositories } from "../../../../data/repositories";
import { interpretUpdate, verifyTelegramRequest, type TelegramUpdate } from "../../../../integrations/telegram/update";

type Dependencies = { config: RuntimeConfig; repos: Repositories };

export function createWebhookHandler({ config, repos }: Dependencies) {
  return async function POST(request: Request): Promise<Response> {
    let update: TelegramUpdate;
    try {
      update = await request.json() as TelegramUpdate;
      const auth = verifyTelegramRequest(update, request.headers.get("x-telegram-bot-api-secret-token"), config);
      const scope = { organizationId: config.organizationId };
      const existing = (await repos.tasks.list(scope)).find((task) => task.idempotencyKey === `telegram:${update.update_id}`);
      if (existing) return Response.json({ status: existing.state, taskId: existing.id, duplicate: true }, { status: 200 });
      const intent = interpretUpdate(update);
      const context = await repos.contexts.get(scope, "telegram", auth.conversationId);
      if (!context?.clientId && !["create_client", "select_context", "show_progress"].includes(intent.kind)) {
        await repos.questions.put(scope, { id: `question_${update.update_id}`, clientId: undefined, projectId: null, text: "Selecciona o crea un cliente", state: "open" });
        return Response.json({ status: "received", needsContext: true, intent: intent.kind }, { status: 202 });
      }
      const task = await repos.tasks.create(scope, { clientId: context?.clientId ?? "", projectId: context?.projectId ?? null,
        kind: intent.kind, input: { text: intent.text, fields: intent.fields }, idempotencyKey: `telegram:${update.update_id}` });
      await repos.audit.append(scope, { actorType: "owner", actorId: `telegram:${auth.userId}`, action: "telegram.received", targetType: "task", targetId: task.id, metadata: { updateId: update.update_id } });
      return Response.json({ status: "queued", taskId: task.id, clientId: task.clientId, projectId: task.projectId, action: intent.kind }, { status: 202 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid update";
      return Response.json({ error: message }, { status: /secret|owner|private/.test(message) ? 403 : 400 });
    }
  };
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Runtime dependencies are not initialized" }, { status: 503 });
}
