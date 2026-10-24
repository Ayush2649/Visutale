import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, statfs, writeFile } from "node:fs/promises";
import path from "node:path";

const SAFE_SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export class LocalArtifactStore {
  readonly rootDir: string;

  constructor(rootDir = path.resolve(process.cwd(), "runs")) {
    this.rootDir = path.resolve(rootDir);
  }

  resolveRunDir(ownerId: string, projectId: string, versionId: string): string {
    for (const [name, value] of Object.entries({ ownerId, projectId, versionId })) {
      if (!SAFE_SEGMENT.test(value)) throw new Error(`${name} contains unsupported path characters.`);
    }
    const result = path.resolve(this.rootDir, ownerId, projectId, versionId);
    this.assertInsideRoot(result);
    return result;
  }

  resolveArtifactPath(runDir: string, relativePath: string): string {
    if (path.isAbsolute(relativePath)) throw new Error("Artifact path must be relative.");
    const normalizedRunDir = path.resolve(runDir);
    this.assertInsideRoot(normalizedRunDir);
    const fullPath = path.resolve(normalizedRunDir, relativePath);
    const relative = path.relative(normalizedRunDir, fullPath);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Artifact path escapes the run directory.");
    }
    return fullPath;
  }

  async ensureRunDir(runDir: string): Promise<void> {
    this.assertInsideRoot(path.resolve(runDir));
    await mkdir(runDir, { recursive: true });
  }

  async writeText(runDir: string, relativePath: string, contents: string): Promise<void> {
    const destination = this.resolveArtifactPath(runDir, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
    try {
      await writeFile(temporary, contents, { encoding: "utf8", flag: "wx" });
      
      let renamed = false;
      let lastErr: unknown;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          await rename(temporary, destination);
          renamed = true;
          break;
        } catch (err: unknown) {
          lastErr = err;
          const code = (err as { code?: string })?.code;
          if (code === "EPERM" || code === "EBUSY" || code === "EACCES") {
            await new Promise((r) => setTimeout(r, 60 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }

      if (!renamed) {
        // Fallback: write directly to destination if Windows file-lock blocked atomic rename
        await writeFile(destination, contents, { encoding: "utf8" });
        await rm(temporary, { force: true }).catch(() => undefined);
      }
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async writeJson<T>(runDir: string, relativePath: string, value: T): Promise<void> {
    await this.writeText(runDir, relativePath, `${JSON.stringify(value, null, 2)}\n`);
  }

  async readText(runDir: string, relativePath: string): Promise<string> {
    return readFile(this.resolveArtifactPath(runDir, relativePath), "utf8");
  }

  async readJson<T>(runDir: string, relativePath: string): Promise<T> {
    return JSON.parse(await this.readText(runDir, relativePath)) as T;
  }

  async exists(runDir: string, relativePath: string): Promise<boolean> {
    try {
      await readFile(this.resolveArtifactPath(runDir, relativePath));
      return true;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") return false;
      throw error;
    }
  }

  async hashFile(runDir: string, relativePath: string): Promise<string> {
    const contents = await readFile(this.resolveArtifactPath(runDir, relativePath));
    return createHash("sha256").update(contents).digest("hex");
  }

  async checkWritable(): Promise<{ writable: boolean; freeBytes?: number; message?: string }> {
    const probeDir = this.rootDir;
    const probePath = path.join(probeDir, `.preflight-${process.pid}-${Date.now()}`);
    try {
      await mkdir(probeDir, { recursive: true });
      await writeFile(probePath, "ok", { flag: "wx" });
      const filesystem = await statfs(probeDir);
      await rm(probePath, { force: true });
      return { writable: true, freeBytes: Number(filesystem.bavail) * Number(filesystem.bsize) };
    } catch (error) {
      await rm(probePath, { force: true }).catch(() => undefined);
      return { writable: false, message: error instanceof Error ? error.message : "Unknown filesystem error." };
    }
  }

  private assertInsideRoot(candidate: string): void {
    const relative = path.relative(this.rootDir, candidate);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Path escapes the configured artifact root.");
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
