import fs from "node:fs";
import path from "node:path";
const db = path.resolve(process.cwd(), process.env.DATABASE_PATH || "data/maliktboard.db");
for (const suffix of ["", "-wal", "-shm"]) {
  const target = db + suffix;
  if (fs.existsSync(target)) fs.rmSync(target);
}
console.log(`Removed ${db}. Restart the app to recreate and seed it.`);
