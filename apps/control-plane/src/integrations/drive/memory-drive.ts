import { randomUUID } from "node:crypto";
import type { DriveItem, DrivePort } from "./port";
export class MemoryDrive implements DrivePort {
  private readonly items = new Map<string, DriveItem>(); private uncertainUsed = false;
  constructor(private readonly options: { uncertainOnceForKey?: string } = {}) {}
  async findByAppKey(appKey: string) { return structuredClone([...this.items.values()].find((i) => i.appKey === appKey) ?? null); }
  async createFolder(parentId: string, name: string, appKey: string) { return this.create(parentId, name, appKey, "application/vnd.google-apps.folder"); }
  async createFile(parentId: string, name: string, appKey: string, _content: string | Uint8Array, mimeType: string) { return this.create(parentId, name, appKey, mimeType); }
  async createShortcut(parentId: string, name: string, appKey: string, _targetId: string) { return this.create(parentId, name, appKey, "application/vnd.google-apps.shortcut"); }
  async getVerifiedLink(id: string) { const item = this.items.get(id); if (!item) throw new Error("Drive item not found"); return item.webViewLink; }
  async countByAppKey(appKey: string) { return [...this.items.values()].filter((i) => i.appKey === appKey).length; }
  private create(parentId: string, name: string, appKey: string, mimeType: string) { const existing = [...this.items.values()].find((i) => i.appKey === appKey); if (existing) return structuredClone(existing); const item = { id: `drive_${randomUUID()}`, name, mimeType, parentId, appKey, webViewLink: `https://drive.example/${appKey}` }; this.items.set(item.id, item); if (this.options.uncertainOnceForKey === appKey && !this.uncertainUsed) { this.uncertainUsed = true; throw new Error("Drive create result uncertain; reconcile before retry"); } return structuredClone(item); }
}
