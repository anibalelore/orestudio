import { Readable } from "node:stream";
import type { drive_v3 } from "googleapis";
import type { DriveItem, DrivePort } from "./port";

const fields = "id,name,mimeType,parents,appProperties,webViewLink";
export class GoogleDriveAdapter implements DrivePort {
  constructor(private readonly drive: drive_v3.Drive) {}
  async findByAppKey(appKey: string) { const escaped = appKey.replaceAll("'", "\\'"); const response = await this.drive.files.list({ q: `trashed = false and appProperties has { key='oreKey' and value='${escaped}' }`, fields: `files(${fields})`, pageSize: 2 }); const file = response.data.files?.[0]; return file ? this.map(file, appKey) : null; }
  async createFolder(parentId: string, name: string, appKey: string) { return this.create({ name, parents: [parentId], mimeType: "application/vnd.google-apps.folder", appProperties: { oreKey: appKey } }, appKey); }
  async createFile(parentId: string, name: string, appKey: string, content: string | Uint8Array, mimeType: string) { const existing = await this.findByAppKey(appKey); if (existing) return existing; const response = await this.drive.files.create({ requestBody: { name, parents: [parentId], appProperties: { oreKey: appKey } }, media: { mimeType, body: Readable.from(typeof content === "string" ? Buffer.from(content) : Buffer.from(content)) }, fields }); return this.map(response.data, appKey); }
  async createShortcut(parentId: string, name: string, appKey: string, targetId: string) { return this.create({ name, parents: [parentId], mimeType: "application/vnd.google-apps.shortcut", shortcutDetails: { targetId }, appProperties: { oreKey: appKey } }, appKey); }
  async getVerifiedLink(id: string) { const response = await this.drive.files.get({ fileId: id, fields: "id,webViewLink,trashed" }); if (response.data.trashed || !response.data.webViewLink) throw new Error("Drive link is not available"); return response.data.webViewLink; }
  private async create(body: drive_v3.Schema$File, appKey: string) { const existing = await this.findByAppKey(appKey); if (existing) return existing; try { const response = await this.drive.files.create({ requestBody: body, fields }); return this.map(response.data, appKey); } catch (error) { const reconciled = await this.findByAppKey(appKey); if (reconciled) return reconciled; throw error; } }
  private map(file: drive_v3.Schema$File, appKey: string): DriveItem { if (!file.id || !file.name || !file.mimeType) throw new Error("Drive response lacks verified identity"); return { id: file.id, name: file.name, mimeType: file.mimeType, parentId: file.parents?.[0] ?? "", appKey, webViewLink: file.webViewLink ?? "" }; }
}
