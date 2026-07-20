import crypto from "node:crypto";
import { env } from "./env";

export const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
export const randomPin = () => String(crypto.randomInt(100000, 1000000));
export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [kind, salt, hash] = stored.split(":");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(derived, Buffer.from(hash, "hex"));
}

export const hashPin = hashPassword;
export const verifyPin = verifyPassword;

function encryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.pinEncryptionKey).digest();
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

export function decryptSecret(value: string): string {
  const [ivHex, tagHex, encryptedHex] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}
