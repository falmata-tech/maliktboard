import path from "node:path";

const cwd = process.cwd();
const runningFromWebWorkspace = path.basename(cwd) === "web" && path.basename(path.dirname(cwd)) === "apps";
export const projectRoot = runningFromWebWorkspace ? path.resolve(cwd, "../..") : cwd;
const resolveFromRoot = (value: string | undefined, fallback: string) =>
  path.resolve(/* turbopackIgnore: true */ projectRoot, value || fallback);

export const env = {
  appUrl: process.env.APP_URL || "http://localhost:3000",
  databasePath: resolveFromRoot(process.env.DATABASE_PATH, "data/maliktboard.db"),
  uploadDir: resolveFromRoot(process.env.UPLOAD_DIR, "data/uploads"),
  sessionSecret: process.env.SESSION_SECRET || "development-only-change-this-secret-please",
  pinEncryptionKey: process.env.PIN_ENCRYPTION_KEY || "development-only-pin-encryption-key",
  seedDemo: process.env.SEED_DEMO !== "false",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "MaliktBoard <notifications@example.com>",
  cronSecret: process.env.CRON_SECRET || "",
  bootstrapAdminName: process.env.BOOTSTRAP_ADMIN_NAME || "MaliktBoard Administrator",
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || "",
  bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || "",
};

export function configurationWarnings(): string[] {
  const warnings: string[] = [];
  if (env.sessionSecret.startsWith("development-only")) warnings.push("SESSION_SECRET is using the development fallback.");
  if (env.pinEncryptionKey.startsWith("development-only")) warnings.push("PIN_ENCRYPTION_KEY is using the development fallback.");
  if (env.seedDemo) warnings.push("SEED_DEMO is enabled; demonstration users and data are present.");
  if (!env.resendApiKey) warnings.push("RESEND_API_KEY is not configured; email notifications remain queued.");
  if (!env.cronSecret) warnings.push("CRON_SECRET is not configured; the notification job endpoint is disabled.");
  return warnings;
}
