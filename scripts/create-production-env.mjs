import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), ".env.production");
if (fs.existsSync(target) && !process.argv.includes("--force")) {
  console.error(".env.production already exists. Use --force only when you intend to rotate every secret.");
  process.exit(1);
}
const appUrl = process.env.APP_URL || process.argv.find((arg) => arg.startsWith("http")) || "http://localhost:3000";
const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@maliktboard.local";
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || `${crypto.randomBytes(12).toString("base64url")}!9Aa`;
const secret = (bytes = 48) => crypto.randomBytes(bytes).toString("base64url");
const contents = `APP_URL=${appUrl}\nDATABASE_PATH=data/maliktboard.db\nUPLOAD_DIR=data/uploads\nSESSION_SECRET=${secret()}\nPIN_ENCRYPTION_KEY=${secret(64)}\nCRON_SECRET=${secret()}\nSEED_DEMO=false\nBOOTSTRAP_ADMIN_NAME=MaliktBoard Administrator\nBOOTSTRAP_ADMIN_EMAIL=${adminEmail}\nBOOTSTRAP_ADMIN_PASSWORD=${adminPassword}\nRESEND_API_KEY=\nEMAIL_FROM=MaliktBoard <notifications@example.com>\n`;
fs.writeFileSync(target, contents, { mode: 0o600 });
console.log(`Created ${target}`);
console.log(`Bootstrap administrator: ${adminEmail}`);
console.log(`Temporary password: ${adminPassword}`);
console.log("Store this password securely. Change it immediately after first login.");
