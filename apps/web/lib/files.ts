import fs from "node:fs/promises";
import path from "node:path";
import { env } from "./env";
import { id } from "./crypto";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function saveUpload(file: File, folder: string): Promise<{ path: string; name: string; mime: string }> {
  if (!allowed.has(file.type)) throw new Error("Only JPEG, PNG, WebP, or PDF files are allowed.");
  if (file.size > 6 * 1024 * 1024) throw new Error("The file must be 6 MB or smaller.");
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || (file.type === "application/pdf" ? ".pdf" : ".jpg");
  const relative = path.join(folder, `${id("file")}${ext}`);
  const absolute = path.join(env.uploadDir, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));
  return { path: relative, name: file.name.slice(0, 200), mime: file.type };
}

export async function readUpload(relativePath: string): Promise<Buffer> {
  const normalized = path.normalize(relativePath);
  const absolute = path.resolve(env.uploadDir, normalized);
  const relative = path.relative(env.uploadDir, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid file path.");
  return fs.readFile(absolute);
}

export async function deleteUpload(relativePath: string): Promise<void> {
  const normalized = path.normalize(relativePath);
  const absolute = path.resolve(env.uploadDir, normalized);
  const relative = path.relative(env.uploadDir, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return;
  await fs.unlink(absolute).catch(() => undefined);
}
