import { describe, expect, it } from "vitest";
import { MemoryDrive } from "../integrations/drive/memory-drive";
import { ensureClientStructure, ensureProjectStructure, versionedFileName } from "./drive-structure";

describe("Drive structure", () => {
  it("creates the exact client and project folders once across retries", async () => {
    const drive = new MemoryDrive();
    const client = await ensureClientStructure(drive, "root", "client_1", "Café Andino");
    const retry = await ensureClientStructure(drive, "root", "client_1", "Café Andino");
    expect(Object.keys(client.children)).toEqual(["00_Perfil_y_Marca", "01_Administracion", "02_Recursos_Originales", "03_Proyectos", "04_Entregas_y_Publicaciones", "05_Reportes", "99_Archivo"]);
    expect(retry.rootId).toBe(client.rootId);
    const project = await ensureProjectStructure(drive, client.children["03_Proyectos"], "project_1", "Lanzamiento");
    expect(Object.keys(project.children)).toEqual(["00_Brief", "01_Investigacion", "02_Borradores", "03_Revision", "04_Aprobados", "05_Resultados"]);
  });

  it("reconciles an uncertain create response before retrying", async () => {
    const drive = new MemoryDrive({ uncertainOnceForKey: "client:client_1:root" });
    await expect(ensureClientStructure(drive, "root", "client_1", "Cliente")).rejects.toThrow(/uncertain/i);
    const recovered = await ensureClientStructure(drive, "root", "client_1", "Cliente");
    expect(await drive.countByAppKey("client:client_1:root")).toBe(1);
    expect(recovered.rootId).toBeTruthy();
  });

  it("uses concrete versions and never the word final", () => {
    expect(versionedFileName(new Date("2026-10-18"), "lanzamiento", "video-1", "tiktok", 3)).toBe("2026-10-18_lanzamiento_video-1_tiktok_v003");
  });
});
