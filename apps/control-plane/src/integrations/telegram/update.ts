import type { RuntimeConfig } from "../../config";
import type { Intent } from "../../domain/intents";

export type TelegramMessage = {
  message_id: number; from?: { id: number }; chat: { id: number; type: string }; text?: string;
  document?: { file_id: string; file_name?: string; file_size?: number };
  photo?: Array<{ file_id: string; file_size?: number }>;
  voice?: { file_id: string; file_size?: number; duration?: number };
};
export type TelegramUpdate = { update_id: number; message?: TelegramMessage; callback_query?: { id: string; from: { id: number }; data?: string; message?: TelegramMessage } };
export type AuthorizedUpdate = { update: TelegramUpdate; userId: string; chatId: string; conversationId: string };

export function verifyTelegramRequest(update: TelegramUpdate, secret: string | null, config: RuntimeConfig): AuthorizedUpdate {
  if (secret !== config.telegramWebhookSecret) throw new Error("Invalid Telegram webhook secret");
  const message = update.message ?? update.callback_query?.message;
  const userId = String(update.message?.from?.id ?? update.callback_query?.from.id ?? "");
  if (userId !== config.telegramOwnerId) throw new Error("Telegram owner is not authorized");
  if (!message || message.chat.type !== "private" || String(message.chat.id) !== config.telegramPrivateChatId) {
    throw new Error("Only the authorized private chat is accepted");
  }
  return { update, userId, chatId: String(message.chat.id), conversationId: String(message.chat.id) };
}

export function interpretUpdate(update: TelegramUpdate): Intent {
  const message = update.message ?? update.callback_query?.message;
  if (message?.document || message?.photo || message?.voice) {
    const fileId = message.document?.file_id ?? message.voice?.file_id ?? message.photo?.at(-1)?.file_id;
    return { kind: "attach_material", text: message.text ?? "", fields: {}, attachmentFileId: fileId };
  }
  const text = (message?.text ?? "").trim();
  const low = text.toLocaleLowerCase("es");
  const client = text.match(/cliente llamado\s+(.+)$/i)?.[1]?.trim();
  if (/agrega|crea|añade/.test(low) && /cliente/.test(low)) return { kind: "create_client", text, fields: client ? { name: client } : {} };
  if (/crea|nuevo/.test(low) && /proyecto/.test(low)) return { kind: "create_project", text, fields: {} };
  if (/cambia|elige|selecciona/.test(low) && /(marca|cliente|proyecto)/.test(low)) return { kind: "select_context", text, fields: {} };
  if (/pendientes|avance|estado/.test(low)) return { kind: "show_progress", text, fields: {} };
  if (/entrega|archivo/.test(low) && /muestra|ver|consulta/.test(low)) return { kind: "show_deliverables", text, fields: {} };
  if (/aprobar|aprueba/.test(low)) return { kind: "approve", text, fields: {} };
  if (/cambio|cambios|corrige/.test(low)) return { kind: "request_changes", text, fields: {} };
  if (/pausa/.test(low) && /(toda|agencia|global)/.test(low)) return { kind: "pause_global", text, fields: {} };
  if (/pausa/.test(low)) return { kind: "pause_project", text, fields: {} };
  if (/reanuda/.test(low)) return { kind: "resume", text, fields: {} };
  return { kind: text ? "assign_work" : "unknown", text, fields: {} };
}
