export type DriveItem = { id: string; name: string; mimeType: string; parentId: string; appKey: string; webViewLink: string };
export interface DrivePort {
  findByAppKey(appKey: string): Promise<DriveItem | null>;
  createFolder(parentId: string, name: string, appKey: string): Promise<DriveItem>;
  createFile(parentId: string, name: string, appKey: string, content: string | Uint8Array, mimeType: string): Promise<DriveItem>;
  createShortcut(parentId: string, name: string, appKey: string, targetId: string): Promise<DriveItem>;
  getVerifiedLink(id: string): Promise<string>;
}
