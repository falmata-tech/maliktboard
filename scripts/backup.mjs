import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
const root=process.cwd();
const configured=process.env.DATABASE_PATH||"data/maliktboard.db";
const database=path.resolve(root,configured);
if(!fs.existsSync(database)){console.error(`Database not found: ${database}`);process.exit(1);}
const stamp=new Date().toISOString().replace(/[:.]/g,"-");
const destination=path.join(root,"backups",stamp);
fs.mkdirSync(destination,{recursive:true});
const db=new DatabaseSync(database);db.exec("PRAGMA wal_checkpoint(TRUNCATE);");db.close();
fs.copyFileSync(database,path.join(destination,"maliktboard.db"));
const uploads=path.resolve(root,process.env.UPLOAD_DIR||"data/uploads");
if(fs.existsSync(uploads))fs.cpSync(uploads,path.join(destination,"uploads"),{recursive:true});
fs.writeFileSync(path.join(destination,"BACKUP_INFO.txt"),`MaliktBoard backup\nCreated: ${new Date().toISOString()}\nDatabase source: ${database}\n`);
console.log(destination);
