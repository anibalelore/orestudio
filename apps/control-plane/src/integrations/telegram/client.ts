export type TelegramClient = {
  sendMessage(chatId: string, text: string, replyMarkup?: unknown): Promise<{ messageId: number }>;
};

export function createTelegramClient(token: string, fetcher: typeof fetch = fetch): TelegramClient {
  return {
    async sendMessage(chatId, text, replyMarkup) {
      const response = await fetcher(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
      });
      const payload = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };
      if (!response.ok || !payload.ok || !payload.result) throw new Error(payload.description ?? "Telegram request failed");
      return { messageId: payload.result.message_id };
    },
  };
}
