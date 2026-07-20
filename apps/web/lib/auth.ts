import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { encryptSecret, id, randomToken, sha256, verifyPassword } from "./crypto";
import { hasPermission, type Permission, type TeamRole } from "@maliktboard/domain";

const COOKIE = "maliktboard_session";
const COMPANY_COOKIE = "maliktboard_company";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  platformRole: "NONE" | "ADMIN";
  locale: "en" | "am" | "om";
};

export type MemberContext = {
  user: AuthUser;
  memberId: string;
  companyId: string;
  companyName: string;
  companyHandle: string;
  companyStatus: "ACTIVE" | "SUSPENDED";
  role: TeamRole;
  locationIds: string[];
};

export async function login(identifier: string, password: string): Promise<{ ok: boolean; destination?: string; message?: string }> {
  const db = getDb();
  const normalized = identifier.trim().toLowerCase();
  const identifierHash = sha256(normalized);
  const recentFailures = (db.prepare(`SELECT COUNT(*) count FROM login_attempts WHERE identifier_hash=? AND successful=0 AND attempted_at>?`).get(identifierHash, new Date(Date.now()-15*60*1000).toISOString()) as {count:number}).count;
  if (recentFailures >= 10) return { ok: false, message: "Too many unsuccessful login attempts. Try again in 15 minutes." };
  const row = db.prepare(`SELECT * FROM users WHERE active = 1 AND (lower(email) = ? OR phone = ?)`).get(normalized, identifier.trim()) as any;
  if (!row || !verifyPassword(password, row.password_hash)) {
    db.prepare(`INSERT INTO login_attempts (id,identifier_hash,successful,attempted_at) VALUES (?,?,0,?)`).run(id("log"),identifierHash,new Date().toISOString());
    return { ok: false, message: "Incorrect email, phone number, or password." };
  }
  db.prepare(`INSERT INTO login_attempts (id,identifier_hash,successful,attempted_at) VALUES (?,?,1,?)`).run(id("log"),identifierHash,new Date().toISOString());
  const raw = randomToken(32);
  const expires = new Date(Date.now() + THIRTY_DAYS);
  db.prepare(`INSERT INTO sessions (id,user_id,token_hash,token_cipher,expires_at,created_at) VALUES (?,?,?,?,?,?)`)
    .run(id("ses"), row.id, sha256(raw), encryptSecret(raw), expires.toISOString(), new Date().toISOString());
  const store = await cookies();
  store.set(COOKIE, raw, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
  if (row.platform_role === "ADMIN") return { ok: true, destination: "/admin" };
  const membership = db.prepare(`SELECT company_id FROM company_members WHERE user_id = ? AND active = 1 ORDER BY created_at LIMIT 1`).get(row.id) as any;
  if (membership) {
    store.set(COMPANY_COOKIE, membership.company_id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
    return { ok: true, destination: "/app" };
  }
  return { ok: true, destination: "/portal" };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) getDb().prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(sha256(raw));
  store.delete(COOKIE);
  store.delete(COMPANY_COOKIE);
}

export async function currentUser(): Promise<AuthUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const row = getDb().prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > ? AND u.active=1`).get(sha256(raw), new Date().toISOString()) as any;
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, platformRole: row.platform_role, locale: row.locale };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePlatformAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.platformRole !== "ADMIN") redirect("/app");
  return user;
}

export async function setActiveCompany(companyId: string): Promise<void> {
  const user = await requireUser();
  const membership = getDb().prepare(`SELECT 1 FROM company_members WHERE user_id=? AND company_id=? AND active=1`).get(user.id, companyId);
  if (!membership) throw new Error("You do not belong to that company.");
  (await cookies()).set(COMPANY_COOKIE, companyId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: THIRTY_DAYS / 1000 });
}

export async function requireMember(permission?: Permission): Promise<MemberContext> {
  const user = await requireUser();
  const db = getDb();
  const store = await cookies();
  let companyId = store.get(COMPANY_COOKIE)?.value;
  let row = companyId ? db.prepare(`SELECT m.id member_id,m.role,m.company_id,c.name company_name,c.handle company_handle,c.status company_status FROM company_members m JOIN companies c ON c.id=m.company_id WHERE m.user_id=? AND m.company_id=? AND m.active=1`).get(user.id, companyId) as any : null;
  if (!row) {
    row = db.prepare(`SELECT m.id member_id,m.role,m.company_id,c.name company_name,c.handle company_handle,c.status company_status FROM company_members m JOIN companies c ON c.id=m.company_id WHERE m.user_id=? AND m.active=1 ORDER BY m.created_at LIMIT 1`).get(user.id) as any;
    if (!row) redirect("/portal");
    companyId = row.company_id;
    store.set(COMPANY_COOKIE, companyId!, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: THIRTY_DAYS / 1000 });
  }
  if (row.company_status !== "ACTIVE") throw new Error("This company workspace is suspended.");
  const role = row.role as TeamRole;
  if (permission && !hasPermission(role, permission)) throw new Error("You do not have permission to perform this action.");
  const locations = db.prepare(`SELECT location_id FROM member_locations WHERE member_id=?`).all(row.member_id) as Array<{location_id:string}>;
  return {
    user,
    memberId: row.member_id,
    companyId: row.company_id,
    companyName: row.company_name,
    companyHandle: row.company_handle,
    companyStatus: row.company_status,
    role,
    locationIds: locations.map((x) => x.location_id),
  };
}

export function ensureLocationScope(ctx: MemberContext, locationIds: Array<string | null | undefined>): void {
  if (["OWNER","ADMIN","SUPERVISOR"].includes(ctx.role)) return;
  const required = locationIds.filter(Boolean) as string[];
  if (required.length && !required.some((locationId) => ctx.locationIds.includes(locationId))) {
    throw new Error("This work is outside your assigned location scope.");
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < 12) throw new Error("The new password must contain at least 12 characters.");
  if (currentPassword === newPassword) throw new Error("Choose a different new password.");
  const db = getDb();
  const user = db.prepare(`SELECT password_hash FROM users WHERE id=? AND active=1`).get(userId) as {password_hash:string}|undefined;
  if (!user || !verifyPassword(currentPassword, user.password_hash)) throw new Error("The current password is incorrect.");
  const { hashPassword } = await import("./crypto");
  const tx = db.transaction(() => {
    db.prepare(`UPDATE users SET password_hash=? WHERE id=?`).run(hashPassword(newPassword), userId);
    db.prepare(`DELETE FROM sessions WHERE user_id=?`).run(userId);
  });
  tx();
}
