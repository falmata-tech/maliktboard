import Link from "next/link";
import { Building2, KeyRound, LogOut, QrCode, ShieldCheck } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { logoutAction, switchCompanyAction } from "@/app/actions";
import { NavLinks } from "./nav-links";

export async function AppShell({children}:{children:React.ReactNode}){
  const ctx=await requireMember();
  const memberships=getDb().prepare(`SELECT c.id,c.name FROM company_members m JOIN companies c ON c.id=m.company_id WHERE m.user_id=? AND m.active=1 AND c.status='ACTIVE' ORDER BY c.name`).all(ctx.user.id) as Array<{id:string;name:string}>;
  return <div className="shell"><aside className="sidebar"><Link className="logo" href="/"><span className="logo-mark">M</span><span>MaliktBoard</span></Link><div className="tenant"><strong>{ctx.companyName}</strong><small>{ctx.role.replaceAll("_"," ")} workspace</small></div><div className="nav-section">Operations</div><NavLinks role={ctx.role}/><div className="nav-section">Field tools</div><Link className="nav-link" href="/mobile"><QrCode size={18}/><span>Scanner PWA</span></Link><Link className="nav-link" href="/account"><KeyRound size={18}/><span>Account security</span></Link><Link className="nav-link" href={`/c/${ctx.companyHandle}`}><Building2 size={18}/><span>Public page</span></Link>{ctx.user.platformRole==="ADMIN"&&<Link className="nav-link" href="/admin"><ShieldCheck size={18}/><span>Platform admin</span></Link>}<div className="sidebar-foot"><form action={logoutAction}><button className="nav-link" style={{border:0,background:"transparent",width:"100%"}}><LogOut size={18}/><span>Sign out</span></button></form></div></aside><main className="main"><header className="topbar"><div><h1>{ctx.companyName}</h1><div className="muted small">Signed in as {ctx.user.name}</div></div><div className="top-actions">{memberships.length>1&&<form action={switchCompanyAction}><select className="select" name="companyId" defaultValue={ctx.companyId} onChange={(event)=>event.currentTarget.form?.requestSubmit()}>{memberships.map((m)=><option value={m.id} key={m.id}>{m.name}</option>)}</select></form>}<span className="badge blue">{ctx.role.replaceAll("_"," ")}</span></div></header><div className="content">{children}</div></main></div>;
}
