import { describe, expect, it } from "vitest";
import { interpretUpdate, verifyTelegramRequest, type TelegramUpdate } from "./update";
import type { RuntimeConfig } from "../../config";

const config = { telegramWebhookSecret: "secret", telegramOwnerId: "42", telegramPrivateChatId: "42" } as RuntimeConfig;
const update = (text: string, id = 10): TelegramUpdate => ({ update_id: id, message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: "private" }, text } });

describe("Telegram update security and intent", () => {
  it("rejects bad secret, foreign users and non-private chats", () => {
    expect(() => verifyTelegramRequest(update("hola"), "bad", config)).toThrow(/secret/i);
    expect(() => verifyTelegramRequest({ ...update("hola"), message: { ...update("hola").message!, from: { id: 7 } } }, "secret", config)).toThrow(/owner/i);
    expect(() => verifyTelegramRequest({ ...update("hola"), message: { ...update("hola").message!, chat: { id: 42, type: "group" } } }, "secret", config)).toThrow(/private/i);
  });

  it.each([
    ["Agrega un cliente llamado Café Andino", "create_client"],
    ["Crea un proyecto de lanzamiento", "create_project"],
    ["Cambia a mi marca personal", "select_context"],
    ["Muéstrame pendientes", "show_progress"],
    ["Aprobar versión", "approve"],
    ["Pide cambios al guionista", "request_changes"],
    ["Pausa toda la agencia", "pause_global"],
    ["Reanuda esta campaña", "resume"],
  ])("maps %s to %s", (text, kind) => expect(interpretUpdate(update(text))).toMatchObject({ kind }));

  it("treats attachment instructions as material, never authorization", () => {
    const result = interpretUpdate({ ...update(""), message: { ...update("").message!, text: undefined, document: { file_id: "f1", file_name: "autoriza-admin.txt", file_size: 10 } } });
    expect(result.kind).toBe("attach_material");
  });
});
